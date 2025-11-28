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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { UpdatePreferenceDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for current user' })
  async getNotifications(
    @Request() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const userId = req.user.userId;
    return this.notificationsService.getForUser(userId, limit, offset);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Request() req) {
    const userId = req.user.userId;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Request() req, @Param('id') notificationId: string) {
    const userId = req.user.userId;
    await this.notificationsService.markAsRead(notificationId, userId);
    return { success: true };
  }

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req) {
    const userId = req.user.userId;
    await this.notificationsService.markAllAsRead(userId);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  async deleteNotification(@Request() req, @Param('id') notificationId: string) {
    const userId = req.user.userId;
    await this.notificationsService.delete(notificationId, userId);
    return { success: true };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@Request() req) {
    const userId = req.user.userId;
    return this.notificationsService.getPreferences(userId);
  }

  @Post('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreference(
    @Request() req,
    @Body() updatePreferenceDto: UpdatePreferenceDto,
  ) {
    const userId = req.user.userId;
    return this.notificationsService.updatePreference(userId, updatePreferenceDto);
  }
}
