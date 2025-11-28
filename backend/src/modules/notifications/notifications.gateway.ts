import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  afterInit(server: Server) {
    // Set gateway reference in service to avoid circular dependency
    this.notificationsService.setGateway(this);
    this.logger.log('NotificationsGateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ): void {
    if (data.userId) {
      client.join(`user:${data.userId}`);
      this.logger.log(`Client ${client.id} subscribed to user:${data.userId}`);
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ): void {
    if (data.userId) {
      client.leave(`user:${data.userId}`);
      this.logger.log(`Client ${client.id} unsubscribed from user:${data.userId}`);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { notificationId: string; userId: string },
  ): Promise<void> {
    await this.notificationsService.markAsRead(
      data.notificationId,
      data.userId,
    );

    // Broadcast update to user
    this.server.to(`user:${data.userId}`).emit('notificationRead', {
      notificationId: data.notificationId,
    });
  }

  /**
   * Send notification to a specific user
   */
  async sendToUser(userId: string, notification: Notification): Promise<void> {
    this.server.to(`user:${userId}`).emit('notification', notification);
    this.logger.debug(`Sent notification to user:${userId}`);
  }

  /**
   * Send notification to all users in an organization
   */
  async sendToOrganization(
    organizationId: string,
    notification: Notification,
  ): Promise<void> {
    this.server
      .to(`organization:${organizationId}`)
      .emit('notification', notification);
    this.logger.debug(`Sent notification to organization:${organizationId}`);
  }

  /**
   * Update unread count for a user
   */
  async updateUnreadCount(userId: string, count: number): Promise<void> {
    this.server.to(`user:${userId}`).emit('unreadCount', { count });
  }
}
