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
import { SecretsVaultService } from './services/secrets-vault.service';
import {
  CreateSecretDto,
  UpdateSecretDto,
  RotateSecretDto,
  GetSecretsQueryDto,
  GetAccessLogQueryDto,
  SecretResponseDto,
} from './dto/secrets.dto';

@ApiTags('admin-secrets')
@Controller('v1/admin/secrets')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class SecretsController {
  constructor(private readonly secretsService: SecretsVaultService) {}

  @Get()
  @ApiOperation({ summary: 'Get all secrets (values are masked)' })
  @ApiResponse({ status: 200, description: 'Returns all secrets', type: [SecretResponseDto] })
  async getAllSecrets(@Query() query: GetSecretsQueryDto) {
    const secrets = await this.secretsService.getAllSecrets(
      query.category, 
      query.environment,
      query.organizationId,
      query.scope || 'platform',
    );

    // Return masked values for security
    return secrets.map(secret => ({
      id: secret.id,
      key: secret.key,
      maskedValue: this.maskValue(secret.encryptedValue),
      category: secret.category,
      environment: secret.environment,
      description: secret.description,
      organizationId: secret.organizationId,
      isPlatformSecret: secret.isPlatformSecret,
      lastRotatedAt: secret.lastRotatedAt,
      expiresAt: secret.expiresAt,
      createdAt: secret.createdAt,
      updatedAt: secret.updatedAt,
    }));
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all secret categories' })
  @ApiResponse({ status: 200, description: 'Returns categories with counts' })
  async getCategories() {
    const secrets = await this.secretsService.getAllSecrets();
    
    const categoryMap = secrets.reduce((acc, secret) => {
      acc[secret.category] = (acc[secret.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryMap).map(([category, count]) => ({
      category,
      count,
    }));
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a specific secret (decrypted value)' })
  @ApiResponse({ status: 200, description: 'Returns decrypted secret value' })
  async getSecret(
    @Param('key') key: string, 
    @Query('organizationId') organizationId: string,
    @Req() req: any
  ) {
    const adminId = req.user.id;
    const ipAddress = req.ip;

    const value = await this.secretsService.getSecret(key, adminId, organizationId, ipAddress);

    return {
      key,
      value,
      organizationId: organizationId || null,
      warning: 'This value is sensitive. Do not log or expose it.',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new secret' })
  @ApiResponse({ status: 201, description: 'Secret created successfully' })
  async createSecret(@Body() dto: CreateSecretDto, @Req() req: any) {
    const adminId = req.user.id;
    const ipAddress = req.ip;

    const secret = await this.secretsService.createSecret(dto, adminId, ipAddress);

    return {
      id: secret.id,
      key: secret.key,
      category: secret.category,
      message: 'Secret created and encrypted successfully',
    };
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update a secret' })
  @ApiResponse({ status: 200, description: 'Secret updated successfully' })
  async updateSecret(
    @Param('key') key: string,
    @Body() dto: UpdateSecretDto,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    const ipAddress = req.ip;

    const secret = await this.secretsService.updateSecret(key, dto, adminId, ipAddress);

    return {
      id: secret.id,
      key: secret.key,
      message: 'Secret updated successfully',
    };
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a secret' })
  @ApiResponse({ status: 200, description: 'Secret deleted successfully' })
  async deleteSecret(@Param('key') key: string, @Req() req: any) {
    const adminId = req.user.id;
    const ipAddress = req.ip;

    await this.secretsService.deleteSecret(key, adminId, ipAddress);

    return {
      key,
      message: 'Secret deleted successfully',
    };
  }

  @Post(':key/rotate')
  @ApiOperation({ summary: 'Rotate a secret (change value)' })
  @ApiResponse({ status: 200, description: 'Secret rotated successfully' })
  async rotateSecret(
    @Param('key') key: string,
    @Body() dto: RotateSecretDto,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    const ipAddress = req.ip;

    const secret = await this.secretsService.rotateSecret(key, dto, adminId, ipAddress);

    return {
      id: secret.id,
      key: secret.key,
      lastRotatedAt: secret.lastRotatedAt,
      message: 'Secret rotated successfully',
    };
  }

  @Get('audit/access-log')
  @ApiOperation({ summary: 'Get secret access audit log' })
  @ApiResponse({ status: 200, description: 'Returns access log entries' })
  async getAccessLog(@Query() query: GetAccessLogQueryDto) {
    return this.secretsService.getAccessLog({
      secretKey: query.secretKey,
      action: query.action as any,
      limit: query.limit || 50,
      offset: query.offset || 0,
    });
  }

  @Get('audit/rotation-history')
  @ApiOperation({ summary: 'Get secret rotation history' })
  @ApiResponse({ status: 200, description: 'Returns rotation history' })
  async getRotationHistory(@Query('key') key?: string) {
    return this.secretsService.getRotationHistory(key);
  }

  @Post('cache/clear')
  @ApiOperation({ summary: 'Clear secrets cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache() {
    this.secretsService.clearCache();
    return { message: 'Secrets cache cleared successfully' };
  }

  @Get('health/test-encryption')
  @ApiOperation({ summary: 'Test encryption/decryption' })
  @ApiResponse({ status: 200, description: 'Returns encryption test result' })
  async testEncryption() {
    const isWorking = await this.secretsService.testDecryption();
    return {
      status: isWorking ? 'ok' : 'error',
      message: isWorking 
        ? 'Encryption/decryption is working correctly' 
        : 'Encryption test failed - check master key',
    };
  }

  private maskValue(value: string): string {
    if (!value || value.length < 8) return '****';
    return '****' + value.substring(value.length - 4);
  }
}
