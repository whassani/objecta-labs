import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionPlan } from '../../billing/entities/subscription-plan.entity';
import { Subscription, SubscriptionStatus } from '../../billing/entities/subscription.entity';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from '../dto/subscription-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  private readonly logger = new Logger(SubscriptionPlansService.name);

  constructor(
    @InjectRepository(SubscriptionPlan)
    private plansRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
  ) {}

  /**
   * Find all subscription plans
   */
  async findAll(): Promise<SubscriptionPlan[]> {
    return this.plansRepository.find({
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Find all active subscription plans
   */
  async findActive(): Promise<SubscriptionPlan[]> {
    return this.plansRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Find one subscription plan by ID
   */
  async findOne(id: string): Promise<SubscriptionPlan> {
    const plan = await this.plansRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with ID ${id} not found`);
    }
    return plan;
  }

  /**
   * Find subscription plan by tier
   */
  async findByTier(tier: string): Promise<SubscriptionPlan> {
    const plan = await this.plansRepository.findOne({ where: { tier: tier as any } });
    if (!plan) {
      throw new NotFoundException(`Subscription plan with tier ${tier} not found`);
    }
    return plan;
  }

  /**
   * Create a new subscription plan
   */
  async create(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    this.logger.log(`Attempting to create plan with data: ${JSON.stringify(dto)}`);
    
    // Validate required fields
    if (!dto.name || dto.name.trim() === '') {
      this.logger.error('Plan name is missing or empty');
      throw new BadRequestException('Plan name is required');
    }

    if (!dto.tier) {
      this.logger.error('Plan tier is missing');
      throw new BadRequestException('Plan tier is required');
    }

    // Check if plan with same tier already exists
    const existing = await this.plansRepository.findOne({
      where: { tier: dto.tier },
    });

    if (existing) {
      throw new BadRequestException(`Plan with tier ${dto.tier} already exists`);
    }

    // Validate limits (cannot have negative values except -1 for unlimited)
    this.validateLimits(dto.limits);

    try {
      const plan = this.plansRepository.create(dto);
      this.logger.log(`Plan entity created, attempting to save...`);
      const saved = await this.plansRepository.save(plan);
      
      this.logger.log(`Created subscription plan: ${saved.name} (${saved.tier})`);
      return saved;
    } catch (error) {
      this.logger.error(`Error saving plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update subscription plan
   */
  async update(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = await this.findOne(id);

    // If updating limits, validate them
    if (dto.limits) {
      this.validateLimits(dto.limits);
    }

    Object.assign(plan, dto);
    const updated = await this.plansRepository.save(plan);
    
    this.logger.log(`Updated subscription plan: ${updated.name} (${updated.tier})`);
    return updated;
  }

  /**
   * Delete subscription plan
   */
  async delete(id: string): Promise<void> {
    const plan = await this.findOne(id);

    // Check if any active subscriptions are using this plan
    const activeSubscriptions = await this.subscriptionsRepository.count({
      where: { plan: plan.tier as any },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(
        `Cannot delete plan ${plan.name}. ${activeSubscriptions} active subscriptions are using this plan.`
      );
    }

    await this.plansRepository.remove(plan);
    this.logger.log(`Deleted subscription plan: ${plan.name} (${plan.tier})`);
  }

  /**
   * Activate a plan
   */
  async activate(id: string): Promise<SubscriptionPlan> {
    const plan = await this.findOne(id);
    plan.isActive = true;
    const updated = await this.plansRepository.save(plan);
    this.logger.log(`Activated plan: ${updated.name}`);
    return updated;
  }

  /**
   * Deactivate a plan
   */
  async deactivate(id: string): Promise<SubscriptionPlan> {
    const plan = await this.findOne(id);
    plan.isActive = false;
    const updated = await this.plansRepository.save(plan);
    this.logger.log(`Deactivated plan: ${updated.name}`);
    return updated;
  }

  /**
   * Get plan statistics
   */
  async getStatistics(id: string) {
    const plan = await this.findOne(id);

    const totalSubscriptions = await this.subscriptionsRepository.count({
      where: { planId: plan.id },
    });

    const activeSubscriptions = await this.subscriptionsRepository.count({
      where: { planId: plan.id, status: SubscriptionStatus.ACTIVE },
    });

    const revenue = {
      monthly: plan.priceMonthly * activeSubscriptions,
      yearly: plan.priceYearly * activeSubscriptions,
    };

    return {
      plan: {
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        inactive: totalSubscriptions - activeSubscriptions,
      },
      estimatedRevenue: revenue,
    };
  }

  /**
   * Validate plan limits
   */
  private validateLimits(limits: any): void {
    const keys = Object.keys(limits);
    for (const key of keys) {
      const value = limits[key];
      if (typeof value !== 'number') {
        throw new BadRequestException(`Limit ${key} must be a number`);
      }
      if (value < -1) {
        throw new BadRequestException(
          `Limit ${key} must be -1 (unlimited) or a positive number`
        );
      }
    }
  }
}
