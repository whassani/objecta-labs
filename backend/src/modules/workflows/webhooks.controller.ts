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

  // Protected endpoints for webhook management (must come BEFORE catch-all route)
  @Post('create/:workflowId')
  @UseGuards(JwtAuthGuard)
  async createWebhook(@Param('workflowId') workflowId: string, @Request() req) {
    return this.webhookService.createWebhook(workflowId, req.user.organizationId);
  }

  @Get('workflow/:workflowId')
  @UseGuards(JwtAuthGuard)
  async getWebhook(@Param('workflowId') workflowId: string) {
    return this.webhookService.getWebhook(workflowId);
  }

  @Delete('manage/:webhookId')
  @UseGuards(JwtAuthGuard)
  async deleteWebhook(@Param('webhookId') webhookId: string) {
    await this.webhookService.deleteWebhook(webhookId);
    return { message: 'Webhook deleted successfully' };
  }

  @Post('manage/:webhookId/toggle')
  @UseGuards(JwtAuthGuard)
  async toggleWebhook(@Param('webhookId') webhookId: string) {
    return this.webhookService.toggleWebhook(webhookId);
  }

  // Public webhook endpoint (no auth required) - MUST BE LAST
  // This catches all POST requests to /webhooks/:webhookUrl
  @Post(':webhookUrl')
  async handleWebhook(
    @Param('webhookUrl') webhookUrl: string,
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
  ) {
    return this.webhookService.handleWebhook(webhookUrl, payload, headers);
  }
}
