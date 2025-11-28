import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { SubscriptionManagementService } from './services/subscription-management.service';
import { BillingCycle } from './entities/subscription.entity';

class AssignPlanDto {
  organizationId: string;
  planId: string;
  billingCycle?: BillingCycle;
  trialDays?: number;
}

class ApplyDiscountDto {
  organizationId: string;
  percentage: number;
  endDate?: string;
}

@ApiTags('subscriptions')
@Controller('v1/subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionManagementController {
  constructor(
    private readonly subscriptionManagementService: SubscriptionManagementService,
  ) {}

  @Get('my-subscription')
  @ApiOperation({ summary: 'Get current user subscription' })
  async getMySubscription(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.subscriptionManagementService.getOrganizationSubscription(organizationId);
  }

  @Get('my-limits')
  @ApiOperation({ summary: 'Get current user plan limits and features' })
  async getMyLimits(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.subscriptionManagementService.getOrganizationLimits(organizationId);
  }

  @Get('my-usage')
  @ApiOperation({ summary: 'Get current usage' })
  async getMyUsage(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.subscriptionManagementService.getCurrentUsage(organizationId);
  }

  @Get('my-usage-history')
  @ApiOperation({ summary: 'Get usage history' })
  async getMyUsageHistory(@Request() req, @Query('limit') limit?: number) {
    const organizationId = req.user.organizationId;
    return this.subscriptionManagementService.getUsageHistory(
      organizationId,
      limit ? parseInt(limit as any) : 12,
    );
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel subscription at period end' })
  async cancelMySubscription(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.subscriptionManagementService.cancelSubscription(organizationId);
  }

  @Post('reactivate')
  @ApiOperation({ summary: 'Reactivate canceled subscription' })
  async reactivateMySubscription(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.subscriptionManagementService.reactivateSubscription(organizationId);
  }

  // Admin endpoints
  @Post('admin/assign-plan')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Assign plan to organization (Admin only)' })
  async assignPlan(@Body() dto: AssignPlanDto) {
    return this.subscriptionManagementService.assignPlanToOrganization(
      dto.organizationId,
      dto.planId,
      dto.billingCycle || BillingCycle.MONTHLY,
      dto.trialDays || 0,
    );
  }

  @Get('admin/organization/:organizationId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get organization subscription (Admin only)' })
  async getOrganizationSubscription(@Param('organizationId') organizationId: string) {
    return this.subscriptionManagementService.getOrganizationSubscription(organizationId);
  }

  @Get('admin/organization/:organizationId/limits')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get organization limits (Admin only)' })
  async getOrganizationLimits(@Param('organizationId') organizationId: string) {
    return this.subscriptionManagementService.getOrganizationLimits(organizationId);
  }

  @Get('admin/organization/:organizationId/usage')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get organization usage (Admin only)' })
  async getOrganizationUsage(@Param('organizationId') organizationId: string) {
    return this.subscriptionManagementService.getCurrentUsage(organizationId);
  }

  @Post('admin/apply-discount')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Apply discount to organization (Admin only)' })
  async applyDiscount(@Body() dto: ApplyDiscountDto) {
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    return this.subscriptionManagementService.applyDiscount(
      dto.organizationId,
      dto.percentage,
      endDate,
    );
  }

  @Get('admin/stats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get subscription statistics (Admin only)' })
  async getStats() {
    return this.subscriptionManagementService.getSubscriptionStats();
  }

  @Post('admin/cancel/:organizationId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Cancel organization subscription (Admin only)' })
  async cancelOrganizationSubscription(@Param('organizationId') organizationId: string) {
    return this.subscriptionManagementService.cancelSubscription(organizationId);
  }

  @Post('admin/reactivate/:organizationId')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Reactivate organization subscription (Admin only)' })
  async reactivateOrganizationSubscription(@Param('organizationId') organizationId: string) {
    return this.subscriptionManagementService.reactivateSubscription(organizationId);
  }
}
