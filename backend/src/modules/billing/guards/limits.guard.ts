import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CHECK_LIMIT_KEY } from '../decorators/check-limit.decorator';
import { CHECK_FEATURE_KEY } from '../decorators/check-feature.decorator';
import { SubscriptionManagementService } from '../services/subscription-management.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class LimitsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionManagementService: SubscriptionManagementService,
    @InjectRepository(Object) // Will inject the appropriate repository based on limit type
    private repository?: Repository<any>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitType = this.reflector.get<string>(CHECK_LIMIT_KEY, context.getHandler());
    const featureName = this.reflector.get<string>(CHECK_FEATURE_KEY, context.getHandler());

    // If no limit or feature check required, allow
    if (!limitType && !featureName) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.organizationId) {
      throw new ForbiddenException('Organization ID not found');
    }

    // Check feature access
    if (featureName) {
      const hasFeature = await this.subscriptionManagementService.checkFeature(
        user.organizationId,
        featureName,
      );

      if (!hasFeature) {
        throw new ForbiddenException(
          `Your plan does not include the '${featureName}' feature. Please upgrade your plan.`,
        );
      }
    }

    // Check limit
    if (limitType) {
      const currentCount = await this.getCurrentCount(user.organizationId, limitType);
      const { allowed, limit, remaining } = await this.subscriptionManagementService.checkLimit(
        user.organizationId,
        limitType,
        currentCount,
      );

      if (!allowed) {
        throw new ForbiddenException(
          `You have reached your plan limit for ${limitType}. Current: ${currentCount}, Limit: ${limit}. Please upgrade your plan.`,
        );
      }

      // Attach limit info to request for logging
      request.limitInfo = { limitType, currentCount, limit, remaining };
    }

    return true;
  }

  private async getCurrentCount(organizationId: string, limitType: string): Promise<number> {
    // Map limit types to entity counts
    // This is a simplified version - you would query the appropriate repository
    
    const limitTypeMap: Record<string, string> = {
      maxAgents: 'agents',
      maxWorkflows: 'workflows',
      maxTools: 'tools',
      maxDataSources: 'data_sources',
      maxDocuments: 'documents',
      maxTeamMembers: 'users',
    };

    // This is a placeholder - actual implementation would query the database
    // For example: return this.agentRepository.count({ where: { organizationId } });
    
    return 0; // Will be implemented when integrated with actual services
  }
}
