import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BillingController } from './billing.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { SubscriptionManagementController } from './subscription-management.controller';
import { StripeBillingController } from './stripe-billing.controller';
import { BillingService } from './billing.service';
import { SubscriptionManagementService } from './services/subscription-management.service';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { SubscriptionUsageHistory } from './entities/subscription-usage-history.entity';
import { OrganizationLimitsCache } from './entities/organization-limits-cache.entity';
import { Invoice } from './entities/invoice.entity';
import { UsageRecord } from './entities/usage-record.entity';
import { User } from '../auth/entities/user.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      SubscriptionPlan,
      SubscriptionUsageHistory,
      OrganizationLimitsCache,
      Invoice,
      UsageRecord,
      User,
      Organization,
    ]),
    ConfigModule,
    EmailModule,
  ],
  controllers: [
    BillingController,
    StripeWebhookController,
    SubscriptionManagementController,
    StripeBillingController,
  ],
  providers: [
    BillingService,
    SubscriptionManagementService,
  ],
  exports: [
    BillingService,
    SubscriptionManagementService,
  ],
})
export class BillingModule {}
