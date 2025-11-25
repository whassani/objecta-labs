import { Injectable, Logger } from '@nestjs/common';
import { BaseNodeExecutor, NodeExecutionResult } from './base-node.executor';
import { ExecutionContext } from '../workflow-executor.service';

@Injectable()
export class EmailNodeExecutor extends BaseNodeExecutor {
  private readonly logger = new Logger(EmailNodeExecutor.name);

  async execute(node: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      const { to, subject, body, cc, bcc, attachments } = node.data;

      if (!to) {
        throw new Error('Recipient email address (to) is required');
      }

      if (!subject) {
        throw new Error('Email subject is required');
      }

      if (!body) {
        throw new Error('Email body is required');
      }

      // Interpolate email fields with context variables
      const interpolatedTo = this.interpolateTemplate(to, context);
      const interpolatedSubject = this.interpolateTemplate(subject, context);
      const interpolatedBody = this.interpolateTemplate(body, context);
      
      const interpolatedCc = cc ? this.interpolateTemplate(cc, context) : undefined;
      const interpolatedBcc = bcc ? this.interpolateTemplate(bcc, context) : undefined;

      this.logger.log(`Sending email to: ${interpolatedTo}`);
      this.logger.log(`Subject: ${interpolatedSubject}`);

      // TODO: Integrate with actual email service (SendGrid, AWS SES, Nodemailer, etc.)
      // For now, return a placeholder response
      // 
      // Example integration:
      // const emailService = this.emailService;
      // await emailService.send({
      //   to: interpolatedTo,
      //   subject: interpolatedSubject,
      //   body: interpolatedBody,
      //   cc: interpolatedCc,
      //   bcc: interpolatedBcc,
      //   attachments
      // });

      return {
        success: true,
        data: {
          to: interpolatedTo,
          subject: interpolatedSubject,
          body: interpolatedBody,
          cc: interpolatedCc,
          bcc: interpolatedBcc,
          sent: true,
          sentAt: new Date().toISOString(),
          messageId: `msg_${Date.now()}`, // Placeholder
          status: 'Email sent successfully (placeholder)',
          note: 'Email service integration pending. Add SendGrid, AWS SES, or Nodemailer.',
        },
      };
    } catch (error) {
      this.logger.error(`Email sending failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: `Email node execution failed: ${error.message}`,
      };
    }
  }
}
