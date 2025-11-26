import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Job } from './entities/job.entity';

@WebSocketGateway({
  namespace: '/jobs',
  cors: {
    origin: '*',
  },
})
export class JobsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger('JobsGateway');
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    
    if (userId) {
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
    } else {
      this.logger.log(`Client connected: ${client.id} (No user ID)`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe-job')
  handleSubscribeJob(client: Socket, jobId: string) {
    client.join(`job:${jobId}`);
    this.logger.log(`Client ${client.id} subscribed to job ${jobId}`);
  }

  @SubscribeMessage('unsubscribe-job')
  handleUnsubscribeJob(client: Socket, jobId: string) {
    client.leave(`job:${jobId}`);
    this.logger.log(`Client ${client.id} unsubscribed from job ${jobId}`);
  }

  /**
   * Send job created notification
   */
  sendJobCreated(job: Job) {
    // Send to user's sockets
    this.sendToUser(job.userId, 'job-created', job);
    this.logger.log(`Job created: ${job.id}`);
  }

  /**
   * Send job update
   */
  sendJobUpdate(job: Job) {
    // Send to job room
    this.server.to(`job:${job.id}`).emit('job-update', job);
    
    // Also send to user's sockets
    this.sendToUser(job.userId, 'job-update', job);
    
    this.logger.log(`Job update: ${job.id} - ${job.status} (${job.progress?.percentage || 0}%)`);
  }

  /**
   * Send job completed notification
   */
  sendJobCompleted(job: Job) {
    this.server.to(`job:${job.id}`).emit('job-completed', job);
    this.sendToUser(job.userId, 'job-completed', job);
    this.logger.log(`Job completed: ${job.id}`);
  }

  /**
   * Send job failed notification
   */
  sendJobFailed(job: Job) {
    this.server.to(`job:${job.id}`).emit('job-failed', job);
    this.sendToUser(job.userId, 'job-failed', job);
    this.logger.error(`Job failed: ${job.id} - ${job.error?.message}`);
  }

  /**
   * Send to all user's connected sockets
   */
  private sendToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Broadcast to all clients in organization
   */
  sendToOrganization(organizationId: string, event: string, data: any) {
    this.server.to(`org:${organizationId}`).emit(event, data);
  }
}
