import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/workflows',
})
export class WorkflowExecutionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('WorkflowExecutionGateway');
  private executionSubscriptions = new Map<string, Set<string>>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Clean up subscriptions
    this.executionSubscriptions.forEach((clients, executionId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.executionSubscriptions.delete(executionId);
      }
    });
  }

  @SubscribeMessage('subscribe-execution')
  handleSubscribeExecution(
    client: Socket,
    payload: { executionId: string },
  ) {
    const { executionId } = payload;
    
    if (!this.executionSubscriptions.has(executionId)) {
      this.executionSubscriptions.set(executionId, new Set());
    }
    
    this.executionSubscriptions.get(executionId).add(client.id);
    this.logger.log(`Client ${client.id} subscribed to execution ${executionId}`);
    
    client.join(`execution-${executionId}`);
    return { success: true };
  }

  @SubscribeMessage('unsubscribe-execution')
  handleUnsubscribeExecution(
    client: Socket,
    payload: { executionId: string },
  ) {
    const { executionId } = payload;
    
    const clients = this.executionSubscriptions.get(executionId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.executionSubscriptions.delete(executionId);
      }
    }
    
    client.leave(`execution-${executionId}`);
    this.logger.log(`Client ${client.id} unsubscribed from execution ${executionId}`);
    
    return { success: true };
  }

  // Emit events to subscribers
  emitNodeStart(executionId: string, nodeId: string, timestamp: number) {
    this.server.to(`execution-${executionId}`).emit('node-start', {
      type: 'node-start',
      executionId,
      nodeId,
      timestamp,
    });
  }

  emitNodeComplete(
    executionId: string,
    nodeId: string,
    timestamp: number,
    duration: number,
    output: any,
    variables: any,
  ) {
    this.server.to(`execution-${executionId}`).emit('node-complete', {
      type: 'node-complete',
      executionId,
      nodeId,
      timestamp,
      duration,
      output,
      variables,
    });
  }

  emitNodeError(
    executionId: string,
    nodeId: string,
    timestamp: number,
    error: string,
  ) {
    this.server.to(`execution-${executionId}`).emit('node-error', {
      type: 'node-error',
      executionId,
      nodeId,
      timestamp,
      error,
    });
  }

  emitEdgeActivate(executionId: string, edgeId: string) {
    this.server.to(`execution-${executionId}`).emit('edge-activate', {
      type: 'edge-activate',
      executionId,
      edgeId,
    });
  }

  emitExecutionComplete(executionId: string, timestamp: number) {
    this.server.to(`execution-${executionId}`).emit('execution-complete', {
      type: 'execution-complete',
      executionId,
      timestamp,
    });
  }

  emitExecutionFailed(executionId: string, timestamp: number, error: string) {
    this.server.to(`execution-${executionId}`).emit('execution-failed', {
      type: 'execution-failed',
      executionId,
      timestamp,
      error,
    });
  }
}
