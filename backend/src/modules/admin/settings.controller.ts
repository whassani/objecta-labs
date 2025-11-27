import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { SettingsService } from './services/settings.service';
import {
  CreateSystemSettingDto,
  UpdateSystemSettingDto,
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
  CheckFeatureFlagDto,
  CreateOrganizationSettingDto,
  UpdateOrganizationSettingDto,
  UpdateAdminPreferencesDto,
  GetSettingsAuditLogDto,
  SystemSettingResponseDto,
  FeatureFlagResponseDto,
  FeatureFlagCheckResponseDto,
} from './dto/settings.dto';

@ApiTags('admin-settings')
@Controller('v1/admin/settings')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ============================================
  // System Settings Endpoints
  // ============================================

  @Get('system')
  @ApiOperation({ summary: 'Get all system settings' })
  @ApiResponse({ status: 200, description: 'Returns all system settings', type: [SystemSettingResponseDto] })
  async getAllSystemSettings() {
    return this.settingsService.getAllSystemSettings();
  }

  @Get('system/category/:category')
  @ApiOperation({ summary: 'Get system settings by category' })
  @ApiResponse({ status: 200, description: 'Returns settings for a category' })
  async getSystemSettingsByCategory(@Param('category') category: string) {
    return this.settingsService.getSystemSettingsByCategory(category);
  }

  @Get('system/:category/:key')
  @ApiOperation({ summary: 'Get a specific system setting' })
  @ApiResponse({ status: 200, description: 'Returns a specific setting' })
  async getSystemSetting(
    @Param('category') category: string,
    @Param('key') key: string,
  ) {
    return this.settingsService.getSystemSetting(category, key);
  }

  @Post('system')
  @ApiOperation({ summary: 'Create a new system setting' })
  @ApiResponse({ status: 201, description: 'Setting created successfully' })
  async createSystemSetting(
    @Body() dto: CreateSystemSettingDto,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    return this.settingsService.createSystemSetting(dto, adminId);
  }

  @Put('system/:category/:key')
  @ApiOperation({ summary: 'Update a system setting' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  async updateSystemSetting(
    @Param('category') category: string,
    @Param('key') key: string,
    @Body() dto: UpdateSystemSettingDto,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    const ipAddress = req.ip;
    return this.settingsService.updateSystemSetting(category, key, dto, adminId, ipAddress);
  }

  @Delete('system/:category/:key')
  @ApiOperation({ summary: 'Delete a system setting' })
  @ApiResponse({ status: 200, description: 'Setting deleted successfully' })
  async deleteSystemSetting(
    @Param('category') category: string,
    @Param('key') key: string,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    await this.settingsService.deleteSystemSetting(category, key, adminId);
    return { message: 'Setting deleted successfully' };
  }

  @Get('system/public/all')
  @ApiOperation({ summary: 'Get all public settings (no auth required)' })
  @ApiResponse({ status: 200, description: 'Returns public settings' })
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  // ============================================
  // Feature Flags Endpoints
  // ============================================

  @Get('features')
  @ApiOperation({ summary: 'Get all feature flags' })
  @ApiResponse({ status: 200, description: 'Returns all feature flags', type: [FeatureFlagResponseDto] })
  async getAllFeatureFlags() {
    return this.settingsService.getAllFeatureFlags();
  }

  @Get('features/:key')
  @ApiOperation({ summary: 'Get a specific feature flag' })
  @ApiResponse({ status: 200, description: 'Returns a specific feature flag' })
  async getFeatureFlag(@Param('key') key: string) {
    return this.settingsService.getFeatureFlag(key);
  }

  @Post('features')
  @ApiOperation({ summary: 'Create a new feature flag' })
  @ApiResponse({ status: 201, description: 'Feature flag created successfully' })
  async createFeatureFlag(
    @Body() dto: CreateFeatureFlagDto,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    return this.settingsService.createFeatureFlag(dto, adminId);
  }

  @Put('features/:key')
  @ApiOperation({ summary: 'Update a feature flag' })
  @ApiResponse({ status: 200, description: 'Feature flag updated successfully' })
  async updateFeatureFlag(
    @Param('key') key: string,
    @Body() dto: UpdateFeatureFlagDto,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    const ipAddress = req.ip;
    return this.settingsService.updateFeatureFlag(key, dto, adminId, ipAddress);
  }

  @Delete('features/:key')
  @ApiOperation({ summary: 'Delete a feature flag' })
  @ApiResponse({ status: 200, description: 'Feature flag deleted successfully' })
  async deleteFeatureFlag(
    @Param('key') key: string,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    await this.settingsService.deleteFeatureFlag(key, adminId);
    return { message: 'Feature flag deleted successfully' };
  }

  @Post('features/check')
  @ApiOperation({ summary: 'Check if a feature is enabled for an organization' })
  @ApiResponse({ status: 200, description: 'Returns feature flag status', type: FeatureFlagCheckResponseDto })
  async checkFeatureFlag(@Body() dto: CheckFeatureFlagDto) {
    const enabled = await this.settingsService.checkFeatureFlag(
      dto.flagKey,
      dto.organizationId,
      dto.plan,
    );

    return {
      flagKey: dto.flagKey,
      enabled,
      reason: enabled ? 'Feature is enabled' : 'Feature is disabled',
    };
  }

  // ============================================
  // Organization Settings Endpoints
  // ============================================

  @Get('organizations/:organizationId')
  @ApiOperation({ summary: 'Get all settings for an organization' })
  @ApiResponse({ status: 200, description: 'Returns organization settings' })
  async getOrganizationSettings(@Param('organizationId') organizationId: string) {
    return this.settingsService.getOrganizationSettings(organizationId);
  }

  @Get('organizations/:organizationId/:key')
  @ApiOperation({ summary: 'Get a specific organization setting' })
  @ApiResponse({ status: 200, description: 'Returns a specific setting' })
  async getOrganizationSetting(
    @Param('organizationId') organizationId: string,
    @Param('key') key: string,
  ) {
    const setting = await this.settingsService.getOrganizationSetting(organizationId, key);
    if (!setting) {
      // Fall back to system default
      const value = await this.settingsService.getOrganizationSettingValue(
        organizationId,
        key,
      );
      return { key, value, isOverride: false };
    }
    return { ...setting, isOverride: true };
  }

  @Post('organizations')
  @ApiOperation({ summary: 'Create an organization setting override' })
  @ApiResponse({ status: 201, description: 'Setting created successfully' })
  async createOrganizationSetting(
    @Body() dto: CreateOrganizationSettingDto,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    return this.settingsService.createOrganizationSetting(dto, adminId);
  }

  @Put('organizations/:organizationId/:key')
  @ApiOperation({ summary: 'Update an organization setting' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  async updateOrganizationSetting(
    @Param('organizationId') organizationId: string,
    @Param('key') key: string,
    @Body() dto: UpdateOrganizationSettingDto,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    const ipAddress = req.ip;
    return this.settingsService.updateOrganizationSetting(
      organizationId,
      key,
      dto,
      adminId,
      ipAddress,
    );
  }

  @Delete('organizations/:organizationId/:key')
  @ApiOperation({ summary: 'Delete an organization setting override' })
  @ApiResponse({ status: 200, description: 'Setting deleted successfully' })
  async deleteOrganizationSetting(
    @Param('organizationId') organizationId: string,
    @Param('key') key: string,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    await this.settingsService.deleteOrganizationSetting(organizationId, key, adminId);
    return { message: 'Organization setting deleted successfully' };
  }

  // ============================================
  // Admin Preferences Endpoints
  // ============================================

  @Get('preferences')
  @ApiOperation({ summary: 'Get admin user preferences' })
  @ApiResponse({ status: 200, description: 'Returns admin preferences' })
  async getAdminPreferences(@Req() req: any) {
    const adminId = req.user.id;
    return this.settingsService.getAdminPreferences(adminId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update admin user preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async updateAdminPreferences(
    @Body() dto: UpdateAdminPreferencesDto,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    return this.settingsService.updateAdminPreferences(adminId, dto);
  }

  // ============================================
  // Audit Log Endpoints
  // ============================================

  @Get('audit')
  @ApiOperation({ summary: 'Get settings audit log' })
  @ApiResponse({ status: 200, description: 'Returns audit log entries' })
  async getSettingsAuditLog(@Query() query: GetSettingsAuditLogDto) {
    return this.settingsService.getSettingsAuditLog({
      settingType: query.settingType,
      settingKey: query.settingKey,
      changedBy: query.changedBy,
      limit: query.limit || 50,
      offset: query.offset || 0,
    });
  }

  // ============================================
  // Utility Endpoints
  // ============================================

  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear settings cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache() {
    this.settingsService.clearSettingsCache();
    return { message: 'Settings cache cleared successfully' };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all setting categories' })
  @ApiResponse({ status: 200, description: 'Returns all categories' })
  async getCategories() {
    const settings = await this.settingsService.getAllSystemSettings();
    const categories = [...new Set(settings.map(s => s.category))];
    
    const grouped = categories.map(category => ({
      category,
      count: settings.filter(s => s.category === category).length,
    }));

    return grouped;
  }
}
