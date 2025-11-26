import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { ApiKey } from '../entities/api-key.entity';

export interface CreateApiKeyDto {
  name: string;
  description?: string;
  scopes?: string[];
  expiresAt?: Date;
}

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeysRepository: Repository<ApiKey>,
  ) {}

  /**
   * Generate a new API key
   * Format: sk_live_<random_32_chars>
   */
  async create(
    userId: string,
    organizationId: string,
    dto: CreateApiKeyDto,
  ): Promise<{ key: string; apiKey: ApiKey }> {
    // Generate random API key
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const apiKey = `sk_live_${randomBytes}`;
    
    // Hash the key for storage
    const keyHash = this.hashKey(apiKey);
    
    // Get prefix for identification
    const keyPrefix = apiKey.substring(0, 16);

    // Create API key record
    const newApiKey = this.apiKeysRepository.create({
      userId,
      organizationId,
      name: dto.name,
      description: dto.description,
      keyHash,
      keyPrefix,
      scopes: dto.scopes || [],
      expiresAt: dto.expiresAt,
      isActive: true,
    });

    await this.apiKeysRepository.save(newApiKey);

    // Return the plain key (only time it's shown)
    return {
      key: apiKey,
      apiKey: newApiKey,
    };
  }

  /**
   * Validate an API key
   */
  async validate(apiKey: string): Promise<ApiKey | null> {
    const keyHash = this.hashKey(apiKey);
    
    const key = await this.apiKeysRepository.findOne({
      where: { keyHash, isActive: true },
      relations: ['user', 'organization'],
    });

    if (!key) {
      return null;
    }

    // Check expiration
    if (key.expiresAt && key.expiresAt < new Date()) {
      return null;
    }

    // Update last used
    key.lastUsedAt = new Date();
    await this.apiKeysRepository.save(key);

    return key;
  }

  /**
   * List user's API keys
   */
  async findAll(userId: string, organizationId: string): Promise<ApiKey[]> {
    return this.apiKeysRepository.find({
      where: { userId, organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get API key by ID
   */
  async findOne(id: string, userId: string, organizationId: string): Promise<ApiKey> {
    const key = await this.apiKeysRepository.findOne({
      where: { id, userId, organizationId },
    });

    if (!key) {
      throw new NotFoundException('API key not found');
    }

    return key;
  }

  /**
   * Revoke an API key
   */
  async revoke(id: string, userId: string, organizationId: string, revokedBy: string): Promise<void> {
    const key = await this.findOne(id, userId, organizationId);

    key.isActive = false;
    key.revokedAt = new Date();
    key.revokedBy = revokedBy;

    await this.apiKeysRepository.save(key);
  }

  /**
   * Delete an API key
   */
  async delete(id: string, userId: string, organizationId: string): Promise<void> {
    const key = await this.findOne(id, userId, organizationId);
    await this.apiKeysRepository.remove(key);
  }

  /**
   * Hash API key for storage
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}
