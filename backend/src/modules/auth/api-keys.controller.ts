import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Roles } from './decorators/roles.decorator';
import { RequirePermissions } from './decorators/permissions.decorator';
import { CurrentUser, UserPayload } from './decorators/current-user.decorator';
import { UserRole } from './enums/role.enum';
import { ApiKeyService, CreateApiKeyDto } from './services/api-key.service';

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller('api-keys')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ApiKeysController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @RequirePermissions('api-keys:create')
  @ApiOperation({ summary: 'Create API key' })
  async create(@Body() dto: CreateApiKeyDto, @CurrentUser() user: UserPayload) {
    return this.apiKeyService.create(user.id, user.organizationId, dto);
  }

  @Get()
  @RequirePermissions('api-keys:read')
  @ApiOperation({ summary: 'List API keys' })
  async findAll(@CurrentUser() user: UserPayload) {
    return this.apiKeyService.findAll(user.id, user.organizationId);
  }

  @Get(':id')
  @RequirePermissions('api-keys:read')
  @ApiOperation({ summary: 'Get API key by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.apiKeyService.findOne(id, user.id, user.organizationId);
  }

  @Delete(':id/revoke')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @RequirePermissions('api-keys:delete')
  @ApiOperation({ summary: 'Revoke API key' })
  async revoke(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.apiKeyService.revoke(id, user.id, user.organizationId, user.id);
    return { message: 'API key revoked successfully' };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions('api-keys:delete')
  @ApiOperation({ summary: 'Delete API key' })
  async delete(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.apiKeyService.delete(id, user.id, user.organizationId);
    return { message: 'API key deleted successfully' };
  }
}
