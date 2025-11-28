import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { SupportService } from './support.service';
import { CreateTicketDto, UpdateTicketDto } from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('admin')
@Controller('v1/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly supportService: SupportService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard metrics' })
  async getDashboard() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('customers')
  @ApiOperation({ summary: 'Get customer list' })
  async getCustomers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('plan') plan?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getCustomers({
      page,
      limit,
      plan,
      status,
      search,
    });
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get customer details' })
  async getCustomerDetails(@Param('id') organizationId: string) {
    return this.adminService.getCustomerDetails(organizationId);
  }

  @Patch('customers/:id')
  @ApiOperation({ summary: 'Update customer' })
  async updateCustomer(
    @Param('id') organizationId: string,
    @Body() updates: any,
    @Request() req,
    @Ip() ip: string,
  ) {
    const result = await this.adminService.updateCustomer(
      organizationId,
      updates,
    );

    // Log action
    await this.adminService.logAction(
      req.user.userId,
      'update_customer',
      'organization',
      organizationId,
      updates,
      ip,
    );

    return result;
  }

  @Post('customers/:id/suspend')
  @ApiOperation({ summary: 'Suspend customer' })
  async suspendCustomer(
    @Param('id') organizationId: string,
    @Body('reason') reason: string,
    @Request() req,
    @Ip() ip: string,
  ) {
    await this.adminService.suspendCustomer(organizationId, reason);

    // Log action
    await this.adminService.logAction(
      req.user.userId,
      'suspend_customer',
      'organization',
      organizationId,
      { reason },
      ip,
    );

    return { success: true };
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get support tickets' })
  async getTickets(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('organizationId') organizationId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.supportService.getTicketQueue({
      status: status as any,
      priority,
      assignedTo,
      organizationId,
      limit,
      offset,
    });
  }

  @Get('tickets/stats')
  @ApiOperation({ summary: 'Get ticket statistics' })
  async getTicketStats() {
    return this.supportService.getTicketStats();
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Create support ticket' })
  async createTicket(@Body() createTicketDto: CreateTicketDto) {
    return this.supportService.createTicket(createTicketDto);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket details' })
  async getTicket(@Param('id') ticketId: string) {
    return this.supportService.getTicket(ticketId);
  }

  @Patch('tickets/:id')
  @ApiOperation({ summary: 'Update ticket' })
  async updateTicket(
    @Param('id') ticketId: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.supportService.updateTicket(ticketId, updateTicketDto);
  }

  @Post('tickets/:id/assign')
  @ApiOperation({ summary: 'Assign ticket' })
  async assignTicket(
    @Param('id') ticketId: string,
    @Body('adminUserId') adminUserId: string,
  ) {
    return this.supportService.assignTicket(ticketId, adminUserId);
  }

  @Post('tickets/:id/resolve')
  @ApiOperation({ summary: 'Resolve ticket' })
  async resolveTicket(
    @Param('id') ticketId: string,
    @Body('resolution') resolution: string,
  ) {
    return this.supportService.resolveTicket(ticketId, resolution);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  async getAuditLogs(
    @Query('adminUserId') adminUserId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAuditLogs({
      adminUserId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
    });
  }
}
