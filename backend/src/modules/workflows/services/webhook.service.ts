import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowWebhook } from '../entities/workflow-webhook.entity';
import { Workflow } from '../entities/workflow.entity';
import { WorkflowExecutorService } from '../workflow-executor.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WorkflowWebhook)
    private webhookRepository: Repository<WorkflowWebhook>,
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    private workflowExecutorService: WorkflowExecutorService,
  ) {}

  /**
   * Create a webhook for a workflow
   */
  async createWebhook(workflowId: string, organizationId: string): Promise<WorkflowWebhook> {
    // Verify workflow exists and belongs to organization
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId, organizationId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }

    // Generate unique webhook URL
    const webhookUrl = this.generateWebhookUrl();
    const secretToken = this.generateSecretToken();

    const webhook = this.webhookRepository.create({
      workflowId,
      webhookUrl,
      secretToken,
      isActive: true,
    });

    return await this.webhookRepository.save(webhook);
  }

  /**
   * Get webhook for a workflow
   */
  async getWebhook(workflowId: string): Promise<WorkflowWebhook | null> {
    return await this.webhookRepository.findOne({
      where: { workflowId },
    });
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.webhookRepository.delete(webhookId);
  }

  /**
   * Handle incoming webhook request
   */
  async handleWebhook(
    webhookUrl: string,
    payload: any,
    headers: Record<string, string>,
  ): Promise<any> {
    this.logger.log(`Webhook received: ${webhookUrl}`);

    // Find webhook
    const webhook = await this.webhookRepository.findOne({
      where: { webhookUrl, isActive: true },
      relations: ['workflow'],
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook not found: ${webhookUrl}`);
    }

    // Verify webhook signature if secret token exists
    if (webhook.secretToken && headers['x-webhook-signature']) {
      const isValid = this.verifySignature(
        payload,
        headers['x-webhook-signature'],
        webhook.secretToken,
      );

      if (!isValid) {
        this.logger.warn(`Invalid webhook signature for ${webhookUrl}`);
        throw new Error('Invalid webhook signature');
      }
    }

    // Execute workflow
    const execution = await this.workflowExecutorService.executeWorkflow(
      webhook.workflowId,
      webhook.workflow.organizationId,
      {
        triggerData: {
          webhookUrl,
          payload,
          headers,
          receivedAt: new Date().toISOString(),
        },
      },
    );

    return {
      success: true,
      executionId: execution.id,
      message: 'Workflow triggered successfully',
    };
  }

  /**
   * Generate a unique webhook URL
   */
  private generateWebhookUrl(): string {
    const randomString = crypto.randomBytes(16).toString('hex');
    return `wh_${randomString}`;
  }

  /**
   * Generate a secret token for webhook verification
   */
  private generateSecretToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify webhook signature
   */
  private verifySignature(payload: any, signature: string, secret: string): boolean {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Generate webhook signature for testing
   */
  generateSignature(payload: any, secret: string): string {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }
}
