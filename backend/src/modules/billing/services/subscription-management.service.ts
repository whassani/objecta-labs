import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus, BillingCycle } from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { OrganizationLimitsCache } from '../entities/organization-limits-cache.entity';
import { SubscriptionUsageHistory } from '../entities/subscription-usage-history.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Injectable()
export class SubscriptionManagementService {
  private readonly logger = new Logger(SubscriptionManagementService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(OrganizationLimitsCache)
    private limitsCache: Repository<OrganizationLimitsCache>,
    @InjectRepository(SubscriptionUsageHistory)
    private usageHistoryRepository: Repository<SubscriptionUsageHistory>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  /**
   * Assign a subscription plan to an organization
   */
  async assignPlanToOrganization(
    organizationId: string,
    planId: string,
    billingCycle: BillingCycle = BillingCycle.MONTHLY,
    trialDays: number = 0,
  ): Promise<Subscription> {
    // Validate organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${organizationId} not found`);
    }

    // Validate plan exists
    const plan = await this.planRepository.findOne({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${planId} not found`);
    }

    if (!plan.isActive) {
      throw new BadRequestException('Cannot assign inactive plan');
    }

    // Check if subscription already exists
    let subscription = await this.subscriptionRepository.findOne({
      where: { organizationId },
      relations: ['subscriptionPlan'],
    });

    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === BillingCycle.YEARLY ? 12 : 1));

    if (subscription) {
      // Update existing subscription
      const oldPlanId = subscription.planId;
      subscription.planId = planId;
      subscription.billingCycle = billingCycle;
      subscription.status = trialDays > 0 ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE;
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = periodEnd;
      subscription.usageResetAt = now;
      subscription.usageTokensCurrentPeriod = 0;

      if (trialDays > 0) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + trialDays);
        subscription.trialEnd = trialEnd;
      }

      this.logger.log(
        `Updated subscription for organization ${organizationId}: ${oldPlanId} → ${planId}`
      );
    } else {
      // Create new subscription
      subscription = this.subscriptionRepository.create({
        organizationId,
        planId,
        billingCycle,
        status: trialDays > 0 ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        usageResetAt: now,
        usageTokensCurrentPeriod: 0,
      });

      if (trialDays > 0) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + trialDays);
        subscription.trialEnd = trialEnd;
      }

      this.logger.log(`Created subscription for organization ${organizationId} with plan ${planId}`);
    }

    const saved = await this.subscriptionRepository.save(subscription);

    // Update limits cache
    await this.updateLimitsCache(organizationId, plan);

    return saved;
  }

  /**
   * Get organization's subscription with plan details
   */
  async getOrganizationSubscription(organizationId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { organizationId },
      relations: ['subscriptionPlan'],
    });
  }

  /**
   * Get organization's plan limits and features
   */
  async getOrganizationLimits(organizationId: string) {
    // Try cache first
    let cache = await this.limitsCache.findOne({
      where: { organizationId },
      relations: ['plan'],
    });

    if (cache) {
      return {
        planId: cache.planId,
        planName: cache.plan?.name,
        limits: cache.limits,
        features: cache.features,
      };
    }

    // Fetch from subscription if not cached
    const subscription = await this.getOrganizationSubscription(organizationId);
    
    if (!subscription || !subscription.subscriptionPlan) {
      // Return free plan limits as default
      const freePlan = await this.planRepository.findOne({
        where: { tier: 'free' as any },
      });

      if (freePlan) {
        await this.updateLimitsCache(organizationId, freePlan);
        return {
          planId: freePlan.id,
          planName: freePlan.name,
          limits: freePlan.limits,
          features: freePlan.features,
        };
      }

      throw new NotFoundException('No plan found for organization');
    }

    const plan = subscription.subscriptionPlan;
    await this.updateLimitsCache(organizationId, plan);

    return {
      planId: plan.id,
      planName: plan.name,
      limits: plan.limits,
      features: plan.features,
    };
  }

  /**
   * Check if organization can perform an action based on limits
   */
  async checkLimit(
    organizationId: string,
    limitType: string,
    currentCount: number,
  ): Promise<{ allowed: boolean; limit: number; current: number; remaining: number }> {
    const { limits } = await this.getOrganizationLimits(organizationId);
    const limit = limits[limitType];

    if (limit === undefined) {
      throw new BadRequestException(`Unknown limit type: ${limitType}`);
    }

    // -1 means unlimited
    if (limit === -1) {
      return {
        allowed: true,
        limit: -1,
        current: currentCount,
        remaining: -1,
      };
    }

    const allowed = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount);

    return {
      allowed,
      limit,
      current: currentCount,
      remaining,
    };
  }

  /**
   * Check if organization has a specific feature enabled
   */
  async checkFeature(organizationId: string, featureName: string): Promise<boolean> {
    const { features } = await this.getOrganizationLimits(organizationId);
    return features[featureName] === true;
  }

  /**
   * Track token usage for an organization
   */
  async trackTokenUsage(organizationId: string, tokensUsed: number): Promise<void> {
    const subscription = await this.getOrganizationSubscription(organizationId);
    
    if (!subscription) {
      this.logger.warn(`No subscription found for organization ${organizationId}`);
      return;
    }

    // Check if we need to reset usage (new period)
    const now = new Date();
    if (subscription.usageResetAt && now > subscription.usageResetAt) {
      // Save to history
      await this.usageHistoryRepository.save({
        subscriptionId: subscription.id,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.usageResetAt,
        tokensUsed: subscription.usageTokensCurrentPeriod,
      });

      // Reset usage
      subscription.usageTokensCurrentPeriod = 0;
      subscription.usageResetAt = subscription.currentPeriodEnd;
    }

    // Update usage
    subscription.usageTokensCurrentPeriod += tokensUsed;
    await this.subscriptionRepository.save(subscription);

    // Check if limit exceeded
    const { limits } = await this.getOrganizationLimits(organizationId);
    const monthlyLimit = limits.monthlyTokenLimit;

    if (monthlyLimit !== -1 && subscription.usageTokensCurrentPeriod > monthlyLimit) {
      this.logger.warn(
        `Organization ${organizationId} exceeded monthly token limit: ${subscription.usageTokensCurrentPeriod}/${monthlyLimit}`
      );
    }
  }

  /**
   * Get current usage for organization
   */
  async getCurrentUsage(organizationId: string) {
    const subscription = await this.getOrganizationSubscription(organizationId);
    
    if (!subscription) {
      return {
        tokensUsed: 0,
        periodStart: null,
        periodEnd: null,
      };
    }

    return {
      tokensUsed: subscription.usageTokensCurrentPeriod,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      usageResetAt: subscription.usageResetAt,
    };
  }

  /**
   * Get usage history for organization
   */
  async getUsageHistory(organizationId: string, limit: number = 12) {
    const subscription = await this.getOrganizationSubscription(organizationId);
    
    if (!subscription) {
      return [];
    }

    return this.usageHistoryRepository.find({
      where: { subscriptionId: subscription.id },
      order: { periodEnd: 'DESC' },
      take: limit,
    });
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(organizationId: string): Promise<Subscription> {
    const subscription = await this.getOrganizationSubscription(organizationId);
    
    if (!subscription) {
      throw new NotFoundException(`No subscription found for organization ${organizationId}`);
    }

    subscription.cancelAtPeriodEnd = true;
    const updated = await this.subscriptionRepository.save(subscription);

    this.logger.log(`Marked subscription for cancellation: ${organizationId}`);
    return updated;
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(organizationId: string): Promise<Subscription> {
    const subscription = await this.getOrganizationSubscription(organizationId);
    
    if (!subscription) {
      throw new NotFoundException(`No subscription found for organization ${organizationId}`);
    }

    subscription.cancelAtPeriodEnd = false;
    subscription.status = SubscriptionStatus.ACTIVE;
    const updated = await this.subscriptionRepository.save(subscription);

    this.logger.log(`Reactivated subscription: ${organizationId}`);
    return updated;
  }

  /**
   * Update limits cache for an organization
   */
  private async updateLimitsCache(organizationId: string, plan: SubscriptionPlan): Promise<void> {
    const existing = await this.limitsCache.findOne({
      where: { organizationId },
    });

    if (existing) {
      existing.planId = plan.id;
      existing.limits = plan.limits;
      existing.features = plan.features;
      await this.limitsCache.save(existing);
    } else {
      await this.limitsCache.save({
        organizationId,
        planId: plan.id,
        limits: plan.limits,
        features: plan.features,
      });
    }

    this.logger.log(`Updated limits cache for organization ${organizationId}`);
  }

  /**
   * Apply discount to subscription
   */
  async applyDiscount(
    organizationId: string,
    percentage: number,
    endDate?: Date,
  ): Promise<Subscription> {
    const subscription = await this.getOrganizationSubscription(organizationId);
    
    if (!subscription) {
      throw new NotFoundException(`No subscription found for organization ${organizationId}`);
    }

    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('Discount percentage must be between 0 and 100');
    }

    subscription.discountPercentage = percentage;
    subscription.discountEndDate = endDate || null;

    const updated = await this.subscriptionRepository.save(subscription);
    this.logger.log(`Applied ${percentage}% discount to organization ${organizationId}`);

    return updated;
  }

  /**
   * Get subscription statistics for admin
   */
  async getSubscriptionStats() {
    const [total, active, trialing, canceled] = await Promise.all([
      this.subscriptionRepository.count(),
      this.subscriptionRepository.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      this.subscriptionRepository.count({ where: { status: SubscriptionStatus.TRIALING } }),
      this.subscriptionRepository.count({ where: { status: SubscriptionStatus.CANCELED } }),
    ]);

    // Get count per plan
    const planCounts = await this.subscriptionRepository
      .createQueryBuilder('s')
      .select('s.plan_id', 'planId')
      .addSelect('COUNT(*)', 'count')
      .where('s.status = :status', { status: SubscriptionStatus.ACTIVE })
      .groupBy('s.plan_id')
      .getRawMany();

    return {
      total,
      active,
      trialing,
      canceled,
      planCounts,
    };
  }
}
