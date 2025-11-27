import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { CreateNotificationDto, UpdatePreferenceDto, NotificationType } from './dto/notification.dto';
import { EmailService } from '../email/email.service';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private gateway: any; // Will be set by gateway

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private preferencesRepository: Repository<NotificationPreference>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  /**
   * Set gateway reference (called by gateway on init)
   */
  setGateway(gateway: any) {
    this.gateway = gateway;
  }

  /**
   * Create a notification
   */
  async create(
    organizationId: string,
    dto: CreateNotificationDto,
  ): Promise<Notification> {
    // Check user preferences
    const preference = await this.getPreference(dto.userId, dto.type);

    // Only create if in-app notifications are enabled
    if (!preference?.inAppEnabled) {
      this.logger.debug(
        `In-app notifications disabled for user ${dto.userId}, type ${dto.type}`,
      );
      return null;
    }

    const notification = this.notificationsRepository.create({
      organizationId,
      userId: dto.userId,
      type: dto.type,
      category: dto.category,
      title: dto.title,
      message: dto.message,
      data: dto.data,
      link: dto.link,
    });

    const saved = await this.notificationsRepository.save(notification);

    // Emit WebSocket event
    if (this.gateway) {
      try {
        await this.gateway.sendToUser(dto.userId, saved);
      } catch (error) {
        this.logger.error(`Failed to emit WebSocket event: ${error.message}`);
      }
    }

    // Send email if enabled
    if (preference?.emailEnabled) {
      try {
        const user = await this.usersRepository.findOne({
          where: { id: dto.userId },
        });

        if (user?.email) {
          await this.emailService.sendNotification({
            email: user.email,
            title: dto.title,
            message: dto.message,
            metadata: dto.data,
            actionUrl: dto.link,
            actionText: 'View Details',
          });

          this.logger.debug(`Notification email sent to ${user.email}`);
        }
      } catch (error) {
        this.logger.error(`Failed to send notification email: ${error.message}`);
        // Don't fail the notification if email fails
      }
    }

    this.logger.log(`Created notification ${saved.id} for user ${dto.userId}`);
    return saved;
  }

  /**
   * Send notification to user (convenience method)
   */
  async sendToUser(
    organizationId: string,
    userId: string,
    type: NotificationType,
    category: string,
    title: string,
    message: string,
    data?: any,
    link?: string,
  ): Promise<Notification> {
    return this.create(organizationId, {
      userId,
      type,
      category: category as any,
      title,
      message,
      data,
      link,
    });
  }

  /**
   * Get notifications for a user
   */
  async getForUser(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId, isArchived: false },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationsRepository.count({
      where: { userId, isRead: false, isArchived: false },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { id: notificationId, userId },
      { isRead: true, readAt: new Date() },
    );
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  /**
   * Delete notification
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { id: notificationId, userId },
      { isArchived: true },
    );
  }

  /**
   * Get or create preference
   */
  async getPreference(
    userId: string,
    notificationType: string,
  ): Promise<NotificationPreference> {
    let preference = await this.preferencesRepository.findOne({
      where: { userId, notificationType },
    });

    if (!preference) {
      // Create default preference
      preference = this.preferencesRepository.create({
        userId,
        notificationType,
        inAppEnabled: true,
        emailEnabled: true,
        emailFrequency: 'immediate',
      });
      await this.preferencesRepository.save(preference);
    }

    return preference;
  }

  /**
   * Get all preferences for a user
   */
  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    return this.preferencesRepository.find({
      where: { userId },
    });
  }

  /**
   * Update preference
   */
  async updatePreference(
    userId: string,
    dto: UpdatePreferenceDto,
  ): Promise<NotificationPreference> {
    let preference = await this.preferencesRepository.findOne({
      where: { userId, notificationType: dto.notificationType },
    });

    if (!preference) {
      preference = this.preferencesRepository.create({
        userId,
        notificationType: dto.notificationType,
      });
    }

    if (dto.inAppEnabled !== undefined) {
      preference.inAppEnabled = dto.inAppEnabled;
    }
    if (dto.emailEnabled !== undefined) {
      preference.emailEnabled = dto.emailEnabled;
    }
    if (dto.emailFrequency !== undefined) {
      preference.emailFrequency = dto.emailFrequency;
    }

    return this.preferencesRepository.save(preference);
  }
}
