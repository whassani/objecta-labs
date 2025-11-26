import { Controller, Post, Body, Param, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConversationsStreamService } from './conversations-stream.service';
import { SendMessageDto } from './dto/conversation.dto';

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsStreamController {
  constructor(private conversationsStreamService: ConversationsStreamService) {}

  @Post(':id/messages/stream')
  @ApiOperation({ summary: 'Send message with streaming response' })
  async streamMessage(
    @Param('id') id: string,
    @Body() messageDto: SendMessageDto,
    @Request() req,
    @Res() res: Response,
  ) {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error('Invalid conversation ID format');
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Send data helper
    const sendEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      await this.conversationsStreamService.sendMessageStream(
        id,
        messageDto,
        req.user.organizationId,
        sendEvent,
      );
      
      res.end();
    } catch (error) {
      sendEvent({
        type: 'error',
        content: 'An error occurred while processing your message.',
      });
      res.end();
    }
  }
}
