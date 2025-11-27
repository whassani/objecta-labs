import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Subscription } from './entities/subscription.entity';
import { Invoice } from './entities/invoice.entity';
import { UsageRecord } from './entities/usage-record.entity';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe;

  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(UsageRecord)
    private usageRecordsRepository: Repository<UsageRecord>,
    private configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2025-11-17.clover' as any,
      });
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not configured. Billing features will be disabled.');
    }
  }

  /**
   * Get pricing plans configuration
   */
  getPricingPlans() {
    return {
      free: {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'month',
        features: {
          agents: 1,
          messagesPerMonth: 1000,
          users: 1,
          storage: 100, // MB
          knowledgeBase: false,
          workflows: false,
          support: 'community',
        },
      },
      starter: {
        id: 'starter',
        name: 'Starter',
        price: 29,
        interval: 'month',
        stripePriceId: this.configService.get<string>('STRIPE_STARTER_PRICE_ID'),
        features: {
          agents: 5,
          messagesPerMonth: 10000,
          users: 3,
          storage: 1000, // MB
          knowledgeBase: true,
          workflows: true,
          support: 'email',
        },
      },
      professional: {
        id: 'professional',
        name: 'Professional',
        price: 99,
        interval: 'month',
        stripePriceId: this.configService.get<string>('STRIPE_PROFESSIONAL_PRICE_ID'),
        features: {
          agents: 25,
          messagesPerMonth: 100000,
          users: 10,
          storage: 10000, // MB
          knowledgeBase: true,
          workflows: true,
          fineTuning: true,
          support: 'priority',
        },
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: null, // Custom pricing
        interval: 'month',
        features: {
          agents: -1, // Unlimited
          messagesPerMonth: -1,
          users: -1,
          storage: -1,
          knowledgeBase: true,
          workflows: true,
          fineTuning: true,
          sso: true,
          support: 'dedicated',
          sla: true,
        },
      },
    };
  }

  /**
   * Get subscription for an organization
   */
  async getSubscription(organizationId: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { organizationId },
    });

    if (!subscription) {
      // Create a free subscription if none exists
      return this.subscriptionsRepository.save({
        organizationId,
        plan: 'free',
        status: 'active',
      });
    }

    return subscription;
  }

  /**
   * Create a new subscription with Stripe
   */
  async createSubscription(
    organizationId: string,
    dto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    try {
      const plans = this.getPricingPlans();
      const plan = plans[dto.planId];

      if (!plan || !plan.stripePriceId) {
        throw new BadRequestException('Invalid plan selected');
      }

      // Check if subscription already exists
      let subscription = await this.subscriptionsRepository.findOne({
        where: { organizationId },
      });

      // Create or retrieve Stripe customer
      let stripeCustomerId = subscription?.stripeCustomerId;
      
      if (!stripeCustomerId) {
        const customer = await this.stripe.customers.create({
          metadata: { organizationId },
        });
        stripeCustomerId = customer.id;
      }

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(dto.paymentMethodId, {
        customer: stripeCustomerId,
      });

      // Set as default payment method
      await this.stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: dto.paymentMethodId,
        },
      });

      // Create subscription in Stripe
      const stripeSubscription = await this.stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: plan.stripePriceId }],
        metadata: { organizationId },
      });

      // Save or update subscription in database
      if (subscription) {
        subscription.stripeCustomerId = stripeCustomerId;
        subscription.stripeSubscriptionId = stripeSubscription.id;
        subscription.plan = dto.planId;
        subscription.status = stripeSubscription.status;
        subscription.currentPeriodStart = new Date((stripeSubscription as any).current_period_start * 1000);
        subscription.currentPeriodEnd = new Date((stripeSubscription as any).current_period_end * 1000);
        subscription.trialEnd = (stripeSubscription as any).trial_end 
          ? new Date(stripeSubscription.trial_end * 1000) 
          : null;
      } else {
        subscription = this.subscriptionsRepository.create({
          organizationId,
          stripeCustomerId,
          stripeSubscriptionId: stripeSubscription.id,
          plan: dto.planId,
          status: stripeSubscription.status,
          currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
          trialEnd: (stripeSubscription as any).trial_end 
            ? new Date(stripeSubscription.trial_end * 1000) 
            : null,
        });
      }

      return this.subscriptionsRepository.save(subscription);
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  async updateSubscription(
    organizationId: string,
    dto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const subscription = await this.getSubscription(organizationId);

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('No active Stripe subscription found');
    }

    try {
      if (dto.planId) {
        const plans = this.getPricingPlans();
        const plan = plans[dto.planId];

        if (!plan || !plan.stripePriceId) {
          throw new BadRequestException('Invalid plan selected');
        }

        // Get current subscription from Stripe
        const stripeSubscription = await this.stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId,
        );

        // Update subscription in Stripe
        const updatedSubscription = await this.stripe.subscriptions.update(
          subscription.stripeSubscriptionId,
          {
            items: [
              {
                id: stripeSubscription.items.data[0].id,
                price: plan.stripePriceId,
              },
            ],
            proration_behavior: 'create_prorations',
          },
        );

        subscription.plan = dto.planId;
        subscription.status = updatedSubscription.status;
        subscription.currentPeriodStart = new Date((updatedSubscription as any).current_period_start * 1000);
        subscription.currentPeriodEnd = new Date((updatedSubscription as any).current_period_end * 1000);
      }

      if (dto.cancelAtPeriodEnd !== undefined) {
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: dto.cancelAtPeriodEnd,
        });
        subscription.cancelAtPeriodEnd = dto.cancelAtPeriodEnd;
      }

      return this.subscriptionsRepository.save(subscription);
    } catch (error) {
      this.logger.error(`Failed to update subscription: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to update subscription: ${error.message}`);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    organizationId: string,
    immediate: boolean = false,
  ): Promise<Subscription> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const subscription = await this.getSubscription(organizationId);

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('No active Stripe subscription found');
    }

    try {
      if (immediate) {
        await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        subscription.status = 'canceled';
        subscription.plan = 'free';
      } else {
        await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        subscription.cancelAtPeriodEnd = true;
      }

      return this.subscriptionsRepository.save(subscription);
    } catch (error) {
      this.logger.error(`Failed to cancel subscription: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Get invoices for an organization
   */
  async getInvoices(organizationId: string): Promise<Invoice[]> {
    return this.invoicesRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Track usage for billing
   */
  async trackUsage(
    organizationId: string,
    metricType: string,
    quantity: number,
  ): Promise<void> {
    const subscription = await this.getSubscription(organizationId);
    
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Find or create usage record for this period
    let usageRecord = await this.usageRecordsRepository.findOne({
      where: {
        organizationId,
        metricType,
        periodStart,
      },
    });

    if (usageRecord) {
      usageRecord.quantity += quantity;
    } else {
      usageRecord = this.usageRecordsRepository.create({
        organizationId,
        subscriptionId: subscription.id,
        metricType,
        quantity,
        periodStart,
        periodEnd,
      });
    }

    await this.usageRecordsRepository.save(usageRecord);
  }

  /**
   * Get usage for current period
   */
  async getUsage(organizationId: string): Promise<UsageRecord[]> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.usageRecordsRepository.find({
      where: {
        organizationId,
        periodStart,
      },
    });
  }
}
