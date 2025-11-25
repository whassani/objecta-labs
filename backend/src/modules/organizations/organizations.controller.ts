import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateOrganizationDto } from './dto/organization.dto';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current organization' })
  async getCurrent(@Request() req) {
    return this.organizationsService.findOne(req.user.organizationId);
  }

  @Put('current')
  @ApiOperation({ summary: 'Update current organization' })
  async updateCurrent(@Request() req, @Body() updateDto: UpdateOrganizationDto) {
    return this.organizationsService.update(req.user.organizationId, updateDto);
  }
}
