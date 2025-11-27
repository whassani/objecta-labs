import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto, CancelSubscriptionDto } from './dto/subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('api/v1/billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get available pricing plans' })
  @Public()
  getPlans() {
    return this.billingService.getPricingPlans();
  }

  @Get('subscription')
  @ApiOperation({ summary: 'Get current subscription' })
  async getSubscription(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.billingService.getSubscription(organizationId);
  }

  @Post('subscription')
  @ApiOperation({ summary: 'Create a new subscription' })
  async createSubscription(
    @Request() req,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    const organizationId = req.user.organizationId;
    return this.billingService.createSubscription(organizationId, createSubscriptionDto);
  }

  @Patch('subscription')
  @ApiOperation({ summary: 'Update subscription (upgrade/downgrade)' })
  async updateSubscription(
    @Request() req,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    const organizationId = req.user.organizationId;
    return this.billingService.updateSubscription(organizationId, updateSubscriptionDto);
  }

  @Delete('subscription')
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancelSubscription(
    @Request() req,
    @Query() cancelDto: CancelSubscriptionDto,
  ) {
    const organizationId = req.user.organizationId;
    return this.billingService.cancelSubscription(
      organizationId,
      cancelDto.immediate || false,
    );
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get billing invoices' })
  async getInvoices(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.billingService.getInvoices(organizationId);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get current usage' })
  async getUsage(@Request() req) {
    const organizationId = req.user.organizationId;
    return this.billingService.getUsage(organizationId);
  }
}
