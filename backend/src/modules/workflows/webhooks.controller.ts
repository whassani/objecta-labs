import {
  Controller,
  Post,
  Body,
  Headers,
  Param,
  Get,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WebhookService } from './services/webhook.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhookService: WebhookService) {}

  // Public webhook endpoint (no auth required)
  @Post(':webhookUrl')
  async handleWebhook(
    @Param('webhookUrl') webhookUrl: string,
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.webhookService.handleWebhook(webhookUrl, payload, headers);
  }

  // Protected endpoints for webhook management
  @Post('create/:workflowId')
  @UseGuards(JwtAuthGuard)
  async createWebhook(@Param('workflowId') workflowId: string, @Request() req) {
    return this.webhookService.createWebhook(workflowId, req.user.organizationId);
  }

  @Get(':workflowId')
  @UseGuards(JwtAuthGuard)
  async getWebhook(@Param('workflowId') workflowId: string) {
    return this.webhookService.getWebhook(workflowId);
  }

  @Delete(':webhookId')
  @UseGuards(JwtAuthGuard)
  async deleteWebhook(@Param('webhookId') webhookId: string) {
    await this.webhookService.deleteWebhook(webhookId);
    return { message: 'Webhook deleted successfully' };
  }
}
