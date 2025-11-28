import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformUser } from './entities/platform-user.entity';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../auth/entities/user.entity';
import { Subscription, SubscriptionStatus } from '../billing/entities/subscription.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(PlatformUser)
    private platformUsersRepository: Repository<PlatformUser>,
    @InjectRepository(AdminAuditLog)
    private auditLogsRepository: Repository<AdminAuditLog>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
  ) {}

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<any> {
    const [
      totalCustomers,
      activeCustomers,
      totalUsers,
      activeSubscriptions,
    ] = await Promise.all([
      this.organizationsRepository.count(),
      this.organizationsRepository.count({
        where: { planStatus: 'active' },
      }),
      this.usersRepository.count(),
      this.subscriptionsRepository.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
    ]);

    // Calculate MRR (simplified - would need to sum actual subscription amounts)
    const subscriptions = await this.subscriptionsRepository.find({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    const mrr = subscriptions.reduce((total, sub) => {
      const planPrices = { free: 0, starter: 29, professional: 99, enterprise: 299 };
      return total + (planPrices[sub.plan] || 0);
    }, 0);

    return {
      totalCustomers,
      activeCustomers,
      totalUsers,
      activeSubscriptions,
      mrr,
      systemHealth: {
        api: 'healthy',
        database: 'healthy',
        redis: 'healthy',
      },
    };
  }

  /**
   * Get customer list with filters
   */
  async getCustomers(filters: {
    page?: number;
    limit?: number;
    plan?: string;
    status?: string;
    search?: string;
  }): Promise<{ customers: any[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const query = this.organizationsRepository
      .createQueryBuilder('org')
      .orderBy('org.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters.plan) {
      query.andWhere('org.plan = :plan', { plan: filters.plan });
    }

    if (filters.status) {
      query.andWhere('org.plan_status = :status', { status: filters.status });
    }

    if (filters.search) {
      query.andWhere(
        '(org.name ILIKE :search OR org.subdomain ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [customers, total] = await query.getManyAndCount();

    // Fetch subscriptions separately for each customer
    const customersWithSubscriptions = await Promise.all(
      customers.map(async (customer) => {
        const subscription = await this.subscriptionsRepository.findOne({
          where: { organizationId: customer.id },
        });
        return {
          ...customer,
          subscription,
        };
      }),
    );

    return { customers: customersWithSubscriptions, total };
  }

  /**
   * Get customer details
   */
  async getCustomerDetails(organizationId: string): Promise<any> {
    const organization = await this.organizationsRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const [subscription, users, agents, conversations] = await Promise.all([
      this.subscriptionsRepository.findOne({
        where: { organizationId },
      }),
      this.usersRepository.find({
        where: { organizationId },
        select: ['id', 'email', 'firstName', 'lastName', 'createdAt'],
      }),
      // Would need Agent repository
      Promise.resolve([]),
      // Would need Conversation repository
      Promise.resolve([]),
    ]);

    return {
      organization,
      subscription,
      users,
      userCount: users.length,
      agentCount: agents.length,
      conversationCount: conversations.length,
    };
  }

  /**
   * Update customer
   */
  async updateCustomer(
    organizationId: string,
    updates: Partial<Organization>,
  ): Promise<Organization> {
    const organization = await this.organizationsRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    Object.assign(organization, updates);
    return this.organizationsRepository.save(organization);
  }

  /**
   * Suspend customer
   */
  async suspendCustomer(
    organizationId: string,
    reason: string,
  ): Promise<void> {
    await this.organizationsRepository.update(organizationId, {
      planStatus: 'suspended',
    });

    this.logger.warn(`Organization ${organizationId} suspended: ${reason}`);
  }

  /**
   * Log admin action
   */
  async logAction(
    adminUserId: string,
    actionType: string,
    resourceType: string,
    resourceId: string,
    details: any,
    ipAddress: string,
  ): Promise<void> {
    const log = this.auditLogsRepository.create({
      adminUserId,
      actionType,
      resourceType,
      resourceId,
      details,
      ipAddress,
    });

    await this.auditLogsRepository.save(log);
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(
    filters: {
      adminUserId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ): Promise<AdminAuditLog[]> {
    const query = this.auditLogsRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.adminUser', 'admin')
      .orderBy('log.created_at', 'DESC');

    if (filters.adminUserId) {
      query.andWhere('log.admin_user_id = :adminUserId', {
        adminUserId: filters.adminUserId,
      });
    }

    if (filters.startDate) {
      query.andWhere('log.created_at >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      query.andWhere('log.created_at <= :endDate', {
        endDate: filters.endDate,
      });
    }

    return query.limit(filters.limit || 100).getMany();
  }
}
