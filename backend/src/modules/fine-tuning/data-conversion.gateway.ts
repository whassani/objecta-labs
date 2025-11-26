import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface ConversionProgress {
  jobId: string;
  status: 'analyzing' | 'converting' | 'completed' | 'failed';
  currentRow: number;
  totalRows: number;
  percentage: number;
  message: string;
  error?: string;
}

@WebSocketGateway({
  namespace: '/data-conversion',
  cors: {
    origin: '*',
  },
})
export class DataConversionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('DataConversionGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Send progress update to all connected clients or specific client
   */
  sendProgress(progress: ConversionProgress, clientId?: string) {
    if (clientId) {
      this.server.to(clientId).emit('conversion-progress', progress);
    } else {
      this.server.emit('conversion-progress', progress);
    }
    
    this.logger.log(
      `Progress: Job ${progress.jobId} - ${progress.status} (${progress.percentage}%)`,
    );
  }

  /**
   * Send completion notification
   */
  sendCompletion(jobId: string, datasetId: string, clientId?: string) {
    const data = { jobId, datasetId, message: 'Conversion completed successfully!' };
    
    if (clientId) {
      this.server.to(clientId).emit('conversion-completed', data);
    } else {
      this.server.emit('conversion-completed', data);
    }
    
    this.logger.log(`Conversion completed: Job ${jobId}, Dataset ${datasetId}`);
  }

  /**
   * Send error notification
   */
  sendError(jobId: string, error: string, clientId?: string) {
    const data = { jobId, error };
    
    if (clientId) {
      this.server.to(clientId).emit('conversion-error', data);
    } else {
      this.server.emit('conversion-error', data);
    }
    
    this.logger.error(`Conversion error: Job ${jobId} - ${error}`);
  }
}
