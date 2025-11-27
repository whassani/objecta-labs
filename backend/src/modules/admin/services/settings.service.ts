import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../entities/system-setting.entity';
import { FeatureFlag } from '../entities/feature-flag.entity';
import { OrganizationSetting } from '../entities/organization-setting.entity';
import { AdminPreference } from '../entities/admin-preference.entity';
import { SettingsAuditLog } from '../entities/settings-audit-log.entity';
import {
  CreateSystemSettingDto,
  UpdateSystemSettingDto,
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  CreateOrganizationSettingDto,
  UpdateOrganizationSettingDto,
  UpdateAdminPreferencesDto,
} from '../dto/settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private settingsCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
    @InjectRepository(FeatureFlag)
    private featureFlagRepository: Repository<FeatureFlag>,
    @InjectRepository(OrganizationSetting)
    private organizationSettingRepository: Repository<OrganizationSetting>,
    @InjectRepository(AdminPreference)
    private adminPreferenceRepository: Repository<AdminPreference>,
    @InjectRepository(SettingsAuditLog)
    private auditLogRepository: Repository<SettingsAuditLog>,
  ) {}

  // ============================================
  // System Settings
  // ============================================

  async getAllSystemSettings(): Promise<SystemSetting[]> {
    return this.systemSettingRepository.find({
      order: { category: 'ASC', key: 'ASC' },
    });
  }

  async getSystemSettingsByCategory(category: string): Promise<SystemSetting[]> {
    const cacheKey = `settings:category:${category}`;
    
    // Check cache
    if (this.isCacheValid(cacheKey)) {
      return this.settingsCache.get(cacheKey);
    }

    const settings = await this.systemSettingRepository.find({
      where: { category },
      order: { key: 'ASC' },
    });

    // Cache the result
    this.setCache(cacheKey, settings);

    return settings;
  }

  async getSystemSetting(category: string, key: string): Promise<SystemSetting> {
    const cacheKey = `setting:${category}:${key}`;
    
    // Check cache
    if (this.isCacheValid(cacheKey)) {
      return this.settingsCache.get(cacheKey);
    }

    const setting = await this.systemSettingRepository.findOne({
      where: { category, key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting ${category}.${key} not found`);
    }

    // Cache the result
    this.setCache(cacheKey, setting);

    return setting;
  }

  async getSystemSettingValue(category: string, key: string, defaultValue?: any): Promise<any> {
    try {
      const setting = await this.getSystemSetting(category, key);
      return setting.getTypedValue();
    } catch (error) {
      return defaultValue;
    }
  }

  async createSystemSetting(dto: CreateSystemSettingDto, adminId: string): Promise<SystemSetting> {
    // Check if setting already exists
    const existing = await this.systemSettingRepository.findOne({
      where: { category: dto.category, key: dto.key },
    });

    if (existing) {
      throw new BadRequestException(`Setting ${dto.category}.${dto.key} already exists`);
    }

    const setting = this.systemSettingRepository.create({
      ...dto,
      updatedBy: adminId,
    });

    const saved = await this.systemSettingRepository.save(setting);

    // Log the creation
    await this.logSettingChange(
      'system',
      `${dto.category}.${dto.key}`,
      null,
      dto.value,
      adminId,
      'Setting created',
    );

    // Clear cache
    this.clearSettingsCache();

    return saved;
  }

  async updateSystemSetting(
    category: string,
    key: string,
    dto: UpdateSystemSettingDto,
    adminId: string,
    ipAddress?: string,
  ): Promise<SystemSetting> {
    const setting = await this.getSystemSetting(category, key);
    const oldValue = setting.value;

    Object.assign(setting, dto);
    setting.updatedBy = adminId;

    const updated = await this.systemSettingRepository.save(setting);

    // Log the change
    await this.logSettingChange(
      'system',
      `${category}.${key}`,
      oldValue,
      dto.value || oldValue,
      adminId,
      'Setting updated',
      ipAddress,
    );

    // Clear cache
    this.clearSettingsCache();

    return updated;
  }

  async deleteSystemSetting(category: string, key: string, adminId: string): Promise<void> {
    const setting = await this.getSystemSetting(category, key);

    await this.systemSettingRepository.remove(setting);

    // Log the deletion
    await this.logSettingChange(
      'system',
      `${category}.${key}`,
      setting.value,
      null,
      adminId,
      'Setting deleted',
    );

    // Clear cache
    this.clearSettingsCache();
  }

  async getPublicSettings(): Promise<Record<string, any>> {
    const cacheKey = 'settings:public';
    
    // Check cache
    if (this.isCacheValid(cacheKey)) {
      return this.settingsCache.get(cacheKey);
    }

    const settings = await this.systemSettingRepository.find({
      where: { isPublic: true },
    });

    const result: Record<string, any> = {};
    for (const setting of settings) {
      const categoryKey = `${setting.category}.${setting.key}`;
      result[categoryKey] = setting.getTypedValue();
    }

    // Cache the result
    this.setCache(cacheKey, result);

    return result;
  }

  // ============================================
  // Feature Flags
  // ============================================

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    return this.featureFlagRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getFeatureFlag(key: string): Promise<FeatureFlag> {
    const flag = await this.featureFlagRepository.findOne({ where: { key } });

    if (!flag) {
      throw new NotFoundException(`Feature flag ${key} not found`);
    }

    return flag;
  }

  async createFeatureFlag(dto: CreateFeatureFlagDto, adminId: string): Promise<FeatureFlag> {
    // Check if flag already exists
    const existing = await this.featureFlagRepository.findOne({
      where: { key: dto.key },
    });

    if (existing) {
      throw new BadRequestException(`Feature flag ${dto.key} already exists`);
    }

    const flag = this.featureFlagRepository.create({
      ...dto,
      createdBy: adminId,
    });

    const saved = await this.featureFlagRepository.save(flag);

    // Log the creation
    await this.logSettingChange(
      'feature',
      dto.key,
      null,
      JSON.stringify({ enabled: dto.enabled }),
      adminId,
      'Feature flag created',
    );

    return saved;
  }

  async updateFeatureFlag(
    key: string,
    dto: UpdateFeatureFlagDto,
    adminId: string,
    ipAddress?: string,
  ): Promise<FeatureFlag> {
    const flag = await this.getFeatureFlag(key);
    const oldValue = JSON.stringify({ enabled: flag.enabled, rolloutPercentage: flag.rolloutPercentage });

    Object.assign(flag, dto);

    const updated = await this.featureFlagRepository.save(flag);

    // Log the change
    const newValue = JSON.stringify({ enabled: updated.enabled, rolloutPercentage: updated.rolloutPercentage });
    await this.logSettingChange(
      'feature',
      key,
      oldValue,
      newValue,
      adminId,
      'Feature flag updated',
      ipAddress,
    );

    return updated;
  }

  async deleteFeatureFlag(key: string, adminId: string): Promise<void> {
    const flag = await this.getFeatureFlag(key);

    await this.featureFlagRepository.remove(flag);

    // Log the deletion
    await this.logSettingChange(
      'feature',
      key,
      JSON.stringify({ enabled: flag.enabled }),
      null,
      adminId,
      'Feature flag deleted',
    );
  }

  async checkFeatureFlag(key: string, organizationId: string, plan?: string): Promise<boolean> {
    const cacheKey = `feature:${key}:${organizationId}`;
    
    // Check cache
    if (this.isCacheValid(cacheKey)) {
      return this.settingsCache.get(cacheKey);
    }

    try {
      const flag = await this.getFeatureFlag(key);
      const enabled = flag.isEnabledForOrganization(organizationId, plan);

      // Cache the result
      this.setCache(cacheKey, enabled);

      return enabled;
    } catch (error) {
      // If feature flag doesn't exist, default to false
      return false;
    }
  }

  // ============================================
  // Organization Settings
  // ============================================

  async getOrganizationSettings(organizationId: string): Promise<OrganizationSetting[]> {
    return this.organizationSettingRepository.find({
      where: { organizationId },
      order: { settingKey: 'ASC' },
    });
  }

  async getOrganizationSetting(organizationId: string, key: string): Promise<OrganizationSetting | null> {
    return this.organizationSettingRepository.findOne({
      where: { organizationId, settingKey: key },
    });
  }

  async getOrganizationSettingValue(
    organizationId: string,
    key: string,
    defaultValue?: any,
  ): Promise<any> {
    // First, check for organization override
    const orgSetting = await this.getOrganizationSetting(organizationId, key);
    if (orgSetting) {
      return orgSetting.getTypedValue();
    }

    // Fall back to system default
    const [category, settingKey] = key.split('.');
    if (category && settingKey) {
      return this.getSystemSettingValue(category, settingKey, defaultValue);
    }

    return defaultValue;
  }

  async createOrganizationSetting(
    dto: CreateOrganizationSettingDto,
    adminId: string,
  ): Promise<OrganizationSetting> {
    // Check if setting already exists
    const existing = await this.getOrganizationSetting(dto.organizationId, dto.settingKey);

    if (existing) {
      throw new BadRequestException(
        `Setting ${dto.settingKey} already exists for organization ${dto.organizationId}`,
      );
    }

    const setting = this.organizationSettingRepository.create({
      ...dto,
      updatedBy: adminId,
    });

    const saved = await this.organizationSettingRepository.save(setting);

    // Log the creation
    await this.logSettingChange(
      'organization',
      `${dto.organizationId}.${dto.settingKey}`,
      null,
      dto.settingValue,
      adminId,
      `Organization setting created: ${dto.notes || 'No notes'}`,
    );

    return saved;
  }

  async updateOrganizationSetting(
    organizationId: string,
    key: string,
    dto: UpdateOrganizationSettingDto,
    adminId: string,
    ipAddress?: string,
  ): Promise<OrganizationSetting> {
    const setting = await this.getOrganizationSetting(organizationId, key);

    if (!setting) {
      throw new NotFoundException(`Setting ${key} not found for organization ${organizationId}`);
    }

    const oldValue = setting.settingValue;

    Object.assign(setting, dto);
    setting.updatedBy = adminId;

    const updated = await this.organizationSettingRepository.save(setting);

    // Log the change
    await this.logSettingChange(
      'organization',
      `${organizationId}.${key}`,
      oldValue,
      dto.settingValue || oldValue,
      adminId,
      dto.notes || 'Organization setting updated',
      ipAddress,
    );

    return updated;
  }

  async deleteOrganizationSetting(
    organizationId: string,
    key: string,
    adminId: string,
  ): Promise<void> {
    const setting = await this.getOrganizationSetting(organizationId, key);

    if (!setting) {
      throw new NotFoundException(`Setting ${key} not found for organization ${organizationId}`);
    }

    await this.organizationSettingRepository.remove(setting);

    // Log the deletion
    await this.logSettingChange(
      'organization',
      `${organizationId}.${key}`,
      setting.settingValue,
      null,
      adminId,
      'Organization setting deleted',
    );
  }

  // ============================================
  // Admin Preferences
  // ============================================

  async getAdminPreferences(adminId: string): Promise<AdminPreference> {
    let prefs = await this.adminPreferenceRepository.findOne({
      where: { adminId },
    });

    // Create default if doesn't exist
    if (!prefs) {
      prefs = this.adminPreferenceRepository.create({
        adminId,
        preferences: {},
      });
      prefs = await this.adminPreferenceRepository.save(prefs);
    }

    return prefs;
  }

  async updateAdminPreferences(
    adminId: string,
    dto: UpdateAdminPreferencesDto,
  ): Promise<AdminPreference> {
    let prefs = await this.adminPreferenceRepository.findOne({
      where: { adminId },
    });

    if (!prefs) {
      prefs = this.adminPreferenceRepository.create({
        adminId,
        preferences: dto.preferences,
      });
    } else {
      prefs.updatePreferences(dto.preferences);
    }

    return this.adminPreferenceRepository.save(prefs);
  }

  // ============================================
  // Audit Log
  // ============================================

  async getSettingsAuditLog(filters: {
    settingType?: string;
    settingKey?: string;
    changedBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: SettingsAuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('log');

    if (filters.settingType) {
      queryBuilder.andWhere('log.setting_type = :settingType', { settingType: filters.settingType });
    }

    if (filters.settingKey) {
      queryBuilder.andWhere('log.setting_key LIKE :settingKey', { settingKey: `%${filters.settingKey}%` });
    }

    if (filters.changedBy) {
      queryBuilder.andWhere('log.changed_by = :changedBy', { changedBy: filters.changedBy });
    }

    queryBuilder.orderBy('log.created_at', 'DESC');

    const total = await queryBuilder.getCount();

    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    const logs = await queryBuilder.getMany();

    return { logs, total };
  }

  private async logSettingChange(
    settingType: 'system' | 'feature' | 'organization' | 'admin',
    settingKey: string,
    oldValue: string | null,
    newValue: string | null,
    changedBy: string,
    changeReason: string,
    ipAddress?: string,
  ): Promise<void> {
    try {
      const log = this.auditLogRepository.create({
        settingType,
        settingKey,
        oldValue,
        newValue,
        changedBy,
        changeReason,
        ipAddress,
      });

      await this.auditLogRepository.save(log);
    } catch (error) {
      this.logger.error(`Failed to log setting change: ${error.message}`);
    }
  }

  // ============================================
  // Cache Management
  // ============================================

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.settingsCache.delete(key);
      this.cacheExpiry.delete(key);
      return false;
    }
    return this.settingsCache.has(key);
  }

  private setCache(key: string, value: any): void {
    this.settingsCache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  clearSettingsCache(): void {
    this.settingsCache.clear();
    this.cacheExpiry.clear();
    this.logger.log('Settings cache cleared');
  }
}
