import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { SubscriptionPlansService } from './services/subscription-plans.service';
import { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from './dto/subscription-plan.dto';

@ApiTags('admin/subscription-plans')
@Controller('v1/admin/subscription-plans')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class SubscriptionPlansController {
  constructor(private readonly plansService: SubscriptionPlansService) {}

  @Get()
  @ApiOperation({ summary: 'Get all subscription plans' })
  async getAllPlans() {
    return this.plansService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active subscription plans' })
  async getActivePlans() {
    return this.plansService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  async getPlan(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Get('tier/:tier')
  @ApiOperation({ summary: 'Get subscription plan by tier' })
  async getPlanByTier(@Param('tier') tier: string) {
    return this.plansService.findByTier(tier);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subscription plan' })
  async createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.plansService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update subscription plan' })
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete subscription plan' })
  async deletePlan(@Param('id') id: string) {
    await this.plansService.delete(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate subscription plan' })
  async activatePlan(@Param('id') id: string) {
    return this.plansService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate subscription plan' })
  async deactivatePlan(@Param('id') id: string) {
    return this.plansService.deactivate(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get plan usage statistics' })
  async getPlanStatistics(@Param('id') id: string) {
    return this.plansService.getStatistics(id);
  }
}
