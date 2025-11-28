import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateConversationDto, SendMessageDto } from './dto/conversation.dto';

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all conversations' })
  async findAll(@Request() req, @Query('agentId') agentId?: string) {
    return this.conversationsService.findAll(req.user.organizationId, req.user.id, agentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error('Invalid conversation ID format');
    }
    return this.conversationsService.findOne(id, req.user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create conversation' })
  async create(@Body() createDto: CreateConversationDto, @Request() req) {
    return this.conversationsService.create(createDto, req.user.organizationId, req.user.id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send message in conversation' })
  async sendMessage(@Param('id') id: string, @Body() messageDto: SendMessageDto, @Request() req) {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error('Invalid conversation ID format');
    }
    return this.conversationsService.sendMessage(id, messageDto, req.user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete conversation' })
  async remove(@Param('id') id: string, @Request() req) {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error('Invalid conversation ID format');
    }
    return this.conversationsService.remove(id, req.user.organizationId);
  }

  @Get('metrics/total')
  @ApiOperation({ summary: 'Get user total token usage' })
  async getTotalMetrics(@Request() req) {
    return this.conversationsService.getUserTotalMetrics(
      req.user.id,
      req.user.organizationId
    );
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get conversation token usage stats' })
  async getConversationMetrics(@Param('id') conversationId: string, @Request() req) {
    return this.conversationsService.getConversationMetrics(
      conversationId,
      req.user.organizationId
    );
  }
}
