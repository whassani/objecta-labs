import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { ApiKeysController } from './api-keys.controller';
import { CredentialsController } from './credentials.controller';
import { PermissionsController } from './permissions.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRoleAssignment } from './entities/user-role.entity';
import { ApiKey } from './entities/api-key.entity';
import { RbacService } from './services/rbac.service';
import { ApiKeyService } from './services/api-key.service';
import { RoleAssignmentService } from './services/role-assignment.service';
import { UserHelperService } from './services/user-helper.service';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { Organization } from '../organizations/entities/organization.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { SecretVault } from '../admin/entities/secret-vault.entity';
import { SecretsAccessLog } from '../admin/entities/secrets-access-log.entity';
import { SecretsRotationHistory } from '../admin/entities/secrets-rotation-history.entity';
import { SecretsVaultService } from '../admin/services/secrets-vault.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User, 
      Organization, 
      Role, 
      UserRoleAssignment, 
      ApiKey,
      SecretVault,
      SecretsAccessLog,
      SecretsRotationHistory,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') || 'your-secret-key';
        return {
          secret: secret,
          signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION') || '7d' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, ApiKeysController, CredentialsController, PermissionsController],
  providers: [
    AuthService,
    RbacService,
    ApiKeyService,
    RoleAssignmentService,
    UserHelperService,
    SecretsVaultService,
    JwtStrategy,
    LocalStrategy,
    RolesGuard,
    PermissionsGuard,
    ApiKeyGuard,
  ],
  exports: [AuthService, RbacService, ApiKeyService, RoleAssignmentService, UserHelperService, SecretsVaultService, RolesGuard, PermissionsGuard, ApiKeyGuard],
})
export class AuthModule {}
