import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserManagementService } from './user-management.service';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, UserQueryDto, CreateOrganizationDto } from './dto/user-management.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('admin-users')
@Controller('v1/admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  async findAll(@Query() query: UserQueryDto) {
    return this.userManagementService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics (admin only)' })
  async getStats() {
    return this.userManagementService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  async findOne(@Param('id') id: string) {
    return this.userManagementService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user (super admin only)' })
  async create(@Body() createUserDto: CreateUserDto, @Request() req) {
    // Check if user is super admin
    if (req.user.adminRole !== 'super_admin') {
      throw new ForbiddenException('Only super admins can create users');
    }
    
    return this.userManagementService.create(createUserDto);
  }

  @Post('organizations')
  @ApiOperation({ summary: 'Create new organization (super admin only)' })
  async createOrganization(@Body() createOrgDto: CreateOrganizationDto, @Request() req) {
    // Check if user is super admin
    if (req.user.adminRole !== 'super_admin') {
      throw new ForbiddenException('Only super admins can create organizations');
    }
    
    return this.userManagementService.createOrganization(createOrgDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (admin only)' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userManagementService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (super admin only)' })
  async remove(@Param('id') id: string, @Request() req) {
    // Check if user is super admin
    if (req.user.adminRole !== 'super_admin') {
      throw new Error('Only super admins can delete users');
    }
    
    return this.userManagementService.remove(id);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend user (admin only)' })
  async suspend(@Param('id') id: string) {
    return this.userManagementService.suspend(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate user (admin only)' })
  async activate(@Param('id') id: string) {
    return this.userManagementService.activate(id);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset user password (admin only)' })
  async resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.userManagementService.resetPassword(id, resetPasswordDto);
  }
}
