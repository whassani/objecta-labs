import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SecretsVaultService } from '../admin/services/secrets-vault.service';
import { CreateSecretDto, UpdateSecretDto } from '../admin/dto/secrets.dto';

@ApiTags('credentials')
@Controller('v1/credentials')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CredentialsController {
  constructor(private readonly secretsService: SecretsVaultService) {}

  @Get()
  @ApiOperation({ summary: 'Get all credentials for current user\'s organization' })
  @ApiResponse({ status: 200, description: 'Returns organization credentials' })
  async getMyCredentials(@Req() req: any) {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return { error: 'User is not associated with an organization', credentials: [] };
    }

    const secrets = await this.secretsService.getAllSecrets(
      undefined, // category
      undefined, // environment
      organizationId,
      'organization', // only org secrets
    );

    // Return masked values
    return secrets.map(secret => ({
      id: secret.id,
      key: secret.key,
      maskedValue: this.maskValue(secret.encryptedValue),
      category: secret.category,
      description: secret.description,
      organizationId: secret.organizationId,
      isPlatformSecret: secret.isPlatformSecret,
      createdAt: secret.createdAt,
      updatedAt: secret.updatedAt,
    }));
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a specific credential (decrypted)' })
  @ApiResponse({ status: 200, description: 'Returns decrypted credential value' })
  async getCredential(@Param('key') key: string, @Req() req: any) {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;
    const ipAddress = req.ip;

    if (!organizationId) {
      throw new Error('User is not associated with an organization');
    }

    const value = await this.secretsService.getSecret(
      key,
      userId,
      organizationId,
      ipAddress,
    );

    return {
      key,
      value,
      warning: 'This value is sensitive. Do not share it.',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new credential for user\'s organization' })
  @ApiResponse({ status: 201, description: 'Credential created successfully' })
  async createCredential(@Body() dto: CreateSecretDto, @Req() req: any) {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;
    const ipAddress = req.ip;

    if (!organizationId) {
      throw new Error('User is not associated with an organization');
    }

    // Force organization-specific settings
    const secretDto = {
      ...dto,
      organizationId,
      isPlatformSecret: false,
    };

    const secret = await this.secretsService.createSecret(secretDto, userId, ipAddress);

    return {
      id: secret.id,
      key: secret.key,
      category: secret.category,
      message: 'Credential created and encrypted successfully',
    };
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update a credential' })
  @ApiResponse({ status: 200, description: 'Credential updated successfully' })
  async updateCredential(
    @Param('key') key: string,
    @Body() dto: UpdateSecretDto,
    @Req() req: any,
  ) {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;
    const ipAddress = req.ip;

    if (!organizationId) {
      throw new Error('User is not associated with an organization');
    }

    // Note: We should add verification that the secret belongs to this org
    const secret = await this.secretsService.updateSecret(key, dto, userId, ipAddress);

    return {
      id: secret.id,
      key: secret.key,
      message: 'Credential updated successfully',
    };
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a credential' })
  @ApiResponse({ status: 200, description: 'Credential deleted successfully' })
  async deleteCredential(@Param('key') key: string, @Req() req: any) {
    const organizationId = req.user.organizationId;
    const userId = req.user.id;
    const ipAddress = req.ip;

    if (!organizationId) {
      throw new Error('User is not associated with an organization');
    }

    // Note: We should add verification that the secret belongs to this org
    await this.secretsService.deleteSecret(key, userId, ipAddress);

    return {
      key,
      message: 'Credential deleted successfully',
    };
  }

  private maskValue(value: string): string {
    if (!value || value.length < 8) return '****';
    return '****' + value.substring(value.length - 4);
  }
}
