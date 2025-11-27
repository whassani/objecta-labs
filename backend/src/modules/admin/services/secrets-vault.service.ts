import { Injectable, Logger, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SecretVault } from '../entities/secret-vault.entity';
import { SecretsAccessLog } from '../entities/secrets-access-log.entity';
import { SecretsRotationHistory } from '../entities/secrets-rotation-history.entity';
import { CreateSecretDto, UpdateSecretDto, RotateSecretDto } from '../dto/secrets.dto';

@Injectable()
export class SecretsVaultService {
  private readonly logger = new Logger(SecretsVaultService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly masterKey: Buffer;
  private readonly secretsCache: Map<string, { value: string; expiry: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(SecretVault)
    private secretVaultRepository: Repository<SecretVault>,
    @InjectRepository(SecretsAccessLog)
    private accessLogRepository: Repository<SecretsAccessLog>,
    @InjectRepository(SecretsRotationHistory)
    private rotationHistoryRepository: Repository<SecretsRotationHistory>,
    private configService: ConfigService,
  ) {
    const masterKeyHex = this.configService.get<string>('SECRETS_MASTER_KEY');
    
    if (!masterKeyHex) {
      this.logger.warn('⚠️  SECRETS_MASTER_KEY not set! Using default key (INSECURE for production!)');
      this.logger.warn('Generate a key: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
      // Default key for development only
      this.masterKey = crypto.randomBytes(32);
    } else {
      try {
        this.masterKey = Buffer.from(masterKeyHex, 'hex');
        if (this.masterKey.length !== 32) {
          throw new Error('Master key must be 32 bytes (64 hex characters)');
        }
        this.logger.log('✅ Secrets vault initialized with master key');
      } catch (error) {
        this.logger.error(`Failed to initialize master key: ${error.message}`);
        throw new Error('Invalid SECRETS_MASTER_KEY format. Must be 64 hex characters.');
      }
    }
  }

  // ============================================
  // Encryption / Decryption
  // ============================================

  private encrypt(plaintext: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  private decrypt(encrypted: string, iv: string, authTag: string): string {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.masterKey,
        Buffer.from(iv, 'hex'),
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`);
      throw new Error('Failed to decrypt secret. Master key may be incorrect.');
    }
  }

  private hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private maskValue(value: string): string {
    if (!value || value.length < 8) return '****';
    return value.substring(0, 4) + '****' + value.substring(value.length - 4);
  }

  // ============================================
  // Secret Management
  // ============================================

  async createSecret(
    dto: CreateSecretDto,
    adminId: string,
    ipAddress?: string,
  ): Promise<SecretVault> {
    try {
      // Check if secret already exists for this organization/platform
      const whereCondition: any = { 
        key: dto.key,
        organizationId: dto.organizationId || null,
        isPlatformSecret: dto.isPlatformSecret || false,
      };

      const existing = await this.secretVaultRepository.findOne({
        where: whereCondition,
      });

      if (existing) {
        const scope = dto.organizationId ? `organization ${dto.organizationId}` : 'platform';
        throw new BadRequestException(`Secret with key '${dto.key}' already exists for ${scope}`);
      }

      // Encrypt the value
      const { encrypted, iv, authTag } = this.encrypt(dto.value);

      // Create secret
      const secret = this.secretVaultRepository.create({
        key: dto.key,
        encryptedValue: encrypted,
        iv,
        authTag,
        description: dto.description,
        category: dto.category,
        environment: dto.environment || 'production',
        organizationId: dto.organizationId || null,
        isPlatformSecret: dto.isPlatformSecret || false,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy: adminId,
        updatedBy: adminId,
      });

      const saved = await this.secretVaultRepository.save(secret);

      // Log access
      const logKey = dto.organizationId ? `${dto.organizationId}:${dto.key}` : dto.key;
      await this.logAccess('write', logKey, adminId, ipAddress, true);

      // Clear cache
      this.secretsCache.delete(this.getCacheKey(dto.key, dto.organizationId));

      const scope = dto.organizationId ? `organization ${dto.organizationId}` : 'platform';
      this.logger.log(`Secret created: ${dto.key} for ${scope} by admin ${adminId}`);

      return saved;
    } catch (error) {
      await this.logAccess('write', dto.key, adminId, ipAddress, false, error.message);
      throw error;
    }
  }

  async getAllSecrets(
    category?: string, 
    environment?: string,
    organizationId?: string,
    scope?: 'platform' | 'organization' | 'all',
  ): Promise<SecretVault[]> {
    const query = this.secretVaultRepository.createQueryBuilder('secret');

    if (category) {
      query.andWhere('secret.category = :category', { category });
    }

    if (environment) {
      query.andWhere('secret.environment = :environment', { environment });
    }

    // Filter by scope
    if (scope === 'platform') {
      query.andWhere('secret.is_platform_secret = :isPlatform', { isPlatform: true });
      query.andWhere('secret.organization_id IS NULL');
    } else if (scope === 'organization') {
      if (organizationId) {
        query.andWhere('secret.organization_id = :orgId', { orgId: organizationId });
      } else {
        query.andWhere('secret.organization_id IS NOT NULL');
      }
    } else if (organizationId) {
      // If organizationId provided but scope is 'all', get both platform and org secrets
      query.andWhere(
        '(secret.is_platform_secret = :isPlatform OR secret.organization_id = :orgId)',
        { isPlatform: true, orgId: organizationId }
      );
    }

    query.orderBy('secret.is_platform_secret', 'DESC')
      .addOrderBy('secret.category', 'ASC')
      .addOrderBy('secret.key', 'ASC');

    return query.getMany();
  }

  async getSecret(
    key: string,
    adminId: string,
    organizationId?: string,
    ipAddress?: string,
  ): Promise<string> {
    try {
      const cacheKey = this.getCacheKey(key, organizationId);
      
      // Check cache first
      const cached = this.secretsCache.get(cacheKey);
      if (cached && Date.now() < cached.expiry) {
        await this.logAccess('read', key, adminId, ipAddress, true, null, { cached: true });
        return cached.value;
      }

      // Fetch from database
      const whereCondition: any = { key };
      if (organizationId) {
        whereCondition.organizationId = organizationId;
      } else {
        whereCondition.isPlatformSecret = true;
      }

      const secret = await this.secretVaultRepository.findOne({ where: whereCondition });

      if (!secret) {
        const scope = organizationId ? `organization ${organizationId}` : 'platform';
        throw new NotFoundException(`Secret '${key}' not found for ${scope}`);
      }

      // Check if expired
      if (secret.expiresAt && new Date(secret.expiresAt) < new Date()) {
        throw new BadRequestException(`Secret '${key}' has expired`);
      }

      // Decrypt
      const decrypted = this.decrypt(secret.encryptedValue, secret.iv, secret.authTag);

      // Cache the decrypted value
      this.secretsCache.set(cacheKey, {
        value: decrypted,
        expiry: Date.now() + this.CACHE_TTL,
      });

      // Log access
      const logKey = organizationId ? `${organizationId}:${key}` : key;
      await this.logAccess('read', logKey, adminId, ipAddress, true);

      return decrypted;
    } catch (error) {
      const logKey = organizationId ? `${organizationId}:${key}` : key;
      await this.logAccess('read', logKey, adminId, ipAddress, false, error.message);
      throw error;
    }
  }

  // Helper method to generate cache keys
  private getCacheKey(key: string, organizationId?: string): string {
    return organizationId ? `${organizationId}:${key}` : `platform:${key}`;
  }

  async updateSecret(
    key: string,
    dto: UpdateSecretDto,
    adminId: string,
    ipAddress?: string,
  ): Promise<SecretVault> {
    try {
      const secret = await this.secretVaultRepository.findOne({ where: { key } });

      if (!secret) {
        throw new NotFoundException(`Secret '${key}' not found`);
      }

      // Update value if provided
      if (dto.value) {
        const { encrypted, iv, authTag } = this.encrypt(dto.value);
        secret.encryptedValue = encrypted;
        secret.iv = iv;
        secret.authTag = authTag;
      }

      // Update other fields
      if (dto.description !== undefined) {
        secret.description = dto.description;
      }

      if (dto.expiresAt) {
        secret.expiresAt = new Date(dto.expiresAt);
      }

      secret.updatedBy = adminId;

      const updated = await this.secretVaultRepository.save(secret);

      // Clear cache
      this.secretsCache.delete(key);

      // Log access
      await this.logAccess('update', key, adminId, ipAddress, true);

      this.logger.log(`Secret updated: ${key} by admin ${adminId}`);

      return updated;
    } catch (error) {
      await this.logAccess('update', key, adminId, ipAddress, false, error.message);
      throw error;
    }
  }

  async deleteSecret(
    key: string,
    adminId: string,
    ipAddress?: string,
  ): Promise<void> {
    try {
      const secret = await this.secretVaultRepository.findOne({ where: { key } });

      if (!secret) {
        throw new NotFoundException(`Secret '${key}' not found`);
      }

      await this.secretVaultRepository.remove(secret);

      // Clear cache
      this.secretsCache.delete(key);

      // Log access
      await this.logAccess('delete', key, adminId, ipAddress, true);

      this.logger.log(`Secret deleted: ${key} by admin ${adminId}`);
    } catch (error) {
      await this.logAccess('delete', key, adminId, ipAddress, false, error.message);
      throw error;
    }
  }

  async rotateSecret(
    key: string,
    dto: RotateSecretDto,
    adminId: string,
    ipAddress?: string,
  ): Promise<SecretVault> {
    try {
      const secret = await this.secretVaultRepository.findOne({ where: { key } });

      if (!secret) {
        throw new NotFoundException(`Secret '${key}' not found`);
      }

      // Decrypt old value for history
      const oldValue = this.decrypt(secret.encryptedValue, secret.iv, secret.authTag);
      const oldValueHash = this.hashValue(oldValue);

      // Encrypt new value
      const { encrypted, iv, authTag } = this.encrypt(dto.newValue);
      const newValueHash = this.hashValue(dto.newValue);

      // Update secret
      secret.encryptedValue = encrypted;
      secret.iv = iv;
      secret.authTag = authTag;
      secret.lastRotatedAt = new Date();
      secret.updatedBy = adminId;

      const updated = await this.secretVaultRepository.save(secret);

      // Record rotation history
      await this.rotationHistoryRepository.save({
        secretKey: key,
        rotatedBy: adminId,
        oldValueHash,
        newValueHash,
        rotationReason: dto.rotationReason || 'Manual rotation',
      });

      // Clear cache
      this.secretsCache.delete(key);

      // Log access
      await this.logAccess('rotate', key, adminId, ipAddress, true);

      this.logger.log(`Secret rotated: ${key} by admin ${adminId}`);

      return updated;
    } catch (error) {
      await this.logAccess('rotate', key, adminId, ipAddress, false, error.message);
      throw error;
    }
  }

  // ============================================
  // Access Logging
  // ============================================

  private async logAccess(
    action: 'read' | 'write' | 'update' | 'delete' | 'rotate',
    secretKey: string,
    adminId: string,
    ipAddress?: string,
    success = true,
    errorMessage?: string,
    metadata?: any,
  ): Promise<void> {
    try {
      await this.accessLogRepository.save({
        secretKey,
        action,
        accessedBy: adminId,
        ipAddress,
        success,
        errorMessage,
        metadata: metadata || {},
      });
    } catch (error) {
      this.logger.error(`Failed to log secret access: ${error.message}`);
    }
  }

  async getAccessLog(filters: {
    secretKey?: string;
    action?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: SecretsAccessLog[]; total: number }> {
    const query = this.accessLogRepository.createQueryBuilder('log');

    if (filters.secretKey) {
      query.andWhere('log.secret_key = :secretKey', { secretKey: filters.secretKey });
    }

    if (filters.action) {
      query.andWhere('log.action = :action', { action: filters.action });
    }

    query.orderBy('log.created_at', 'DESC');

    const total = await query.getCount();

    if (filters.limit) {
      query.limit(filters.limit);
    }

    if (filters.offset) {
      query.offset(filters.offset);
    }

    const logs = await query.getMany();

    return { logs, total };
  }

  async getRotationHistory(secretKey?: string): Promise<SecretsRotationHistory[]> {
    const query = this.rotationHistoryRepository.createQueryBuilder('history');

    if (secretKey) {
      query.andWhere('history.secret_key = :secretKey', { secretKey });
    }

    query.orderBy('history.created_at', 'DESC');

    return query.getMany();
  }

  // ============================================
  // Utility Methods
  // ============================================

  clearCache(): void {
    this.secretsCache.clear();
    this.logger.log('Secrets cache cleared');
  }

  async testDecryption(): Promise<boolean> {
    try {
      const testValue = 'test-secret-value';
      const { encrypted, iv, authTag } = this.encrypt(testValue);
      const decrypted = this.decrypt(encrypted, iv, authTag);
      return decrypted === testValue;
    } catch (error) {
      this.logger.error(`Decryption test failed: ${error.message}`);
      return false;
    }
  }
}
