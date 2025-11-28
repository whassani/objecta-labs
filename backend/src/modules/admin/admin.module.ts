import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SupportService } from './support.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { UserManagementController } from './user-management.controller';
import { UserManagementService } from './user-management.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './services/settings.service';
import { SecretsController } from './secrets.controller';
import { SecretsVaultService } from './services/secrets-vault.service';
import { SubscriptionPlansController } from './subscription-plans.controller';
import { SubscriptionPlansService } from './services/subscription-plans.service';
import { PermissionsController } from './permissions.controller';
import { PlatformUsersController } from './platform-users.controller';
import { LLMSettingsController } from './llm-settings.controller';
import { PlatformUser } from './entities/platform-user.entity';
import { SupportTicket } from './entities/support-ticket.entity';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { FeatureFlag } from './entities/feature-flag.entity';
import { OrganizationSetting } from './entities/organization-setting.entity';
import { AdminPreference } from './entities/admin-preference.entity';
import { SettingsAuditLog } from './entities/settings-audit-log.entity';
import { SecretVault } from './entities/secret-vault.entity';
import { SecretsAccessLog } from './entities/secrets-access-log.entity';
import { SecretsRotationHistory } from './entities/secrets-rotation-history.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../auth/entities/user.entity';
import { Subscription } from '../billing/entities/subscription.entity';
import { SubscriptionPlan } from '../billing/entities/subscription-plan.entity';

@Module({
  imports: [
    ConfigModule,
    AuthModule, // Import to access UserHelperService
    TypeOrmModule.forFeature([
      PlatformUser,
      SupportTicket,
      AdminAuditLog,
      User,
      Subscription,
      SubscriptionPlan,
      Organization,
      SystemSetting,
      FeatureFlag,
      OrganizationSetting,
      AdminPreference,
      SettingsAuditLog,
      SecretVault,
      SecretsAccessLog,
      SecretsRotationHistory,
    ]),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'this-is-a-string-secret-at-least-256-bits-long',
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [
    AdminController, 
    AdminAuthController, 
    UserManagementController, 
    PlatformUsersController,
    SettingsController,
    SecretsController,
    SubscriptionPlansController,
    PermissionsController,
    LLMSettingsController,
  ],
  providers: [
    AdminService, 
    SupportService, 
    AdminAuthService, 
    UserManagementService, 
    SettingsService,
    SecretsVaultService,
    SubscriptionPlansService,
  ],
  exports: [
    AdminService, 
    SupportService, 
    AdminAuthService, 
    UserManagementService, 
    SettingsService,
    SecretsVaultService,
  ],
})
export class AdminModule {}
