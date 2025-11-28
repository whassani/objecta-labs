import { Injectable, Logger } from '@nestjs/common';
import { BaseNodeExecutor, NodeExecutionResult } from './base-node.executor';
import { ExecutionContext } from '../workflow-executor.service';
import { EmailService } from '../../email/email.service';

@Injectable()
export class EmailNodeExecutor extends BaseNodeExecutor {
  private readonly logger = new Logger(EmailNodeExecutor.name);

  constructor(private emailService: EmailService) {
    super();
  }

  async execute(node: any, context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      const { to, subject, body, cc, bcc, attachments } = node.data;

      if (!to) {
        return {
          success: false,
          error: 'Email recipient not configured. Please add recipient in the node editor.',
        };
      }

      if (!subject) {
        return {
          success: false,
          error: 'Email subject not configured. Please add subject in the node editor.',
        };
      }

      if (!body) {
        return {
          success: false,
          error: 'Email body not configured. Please add body in the node editor.',
        };
      }

      // Interpolate email fields with context variables
      const interpolatedTo = this.interpolateTemplate(to, context);
      const interpolatedSubject = this.interpolateTemplate(subject, context);
      const interpolatedBody = this.interpolateTemplate(body, context);
      
      const interpolatedCc = cc ? this.interpolateTemplate(cc, context) : undefined;
      const interpolatedBcc = bcc ? this.interpolateTemplate(bcc, context) : undefined;

      this.logger.log(`Sending email to: ${interpolatedTo}`);
      this.logger.log(`Subject: ${interpolatedSubject}`);

      // Send email using the email service
      try {
        await this.emailService.sendNotification({
          email: interpolatedTo,
          title: interpolatedSubject,
          message: interpolatedBody,
          metadata: {
            source: 'workflow',
            cc: interpolatedCc,
            bcc: interpolatedBcc,
          },
        });

        this.logger.log(`Email sent successfully to ${interpolatedTo}`);

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
            provider: 'sendgrid',
            status: 'Email sent successfully',
          },
        };
      } catch (emailError) {
        this.logger.error(`Email sending failed: ${emailError.message}`);
        
        // Return success: false but don't throw to allow workflow to continue
        return {
          success: false,
          error: `Failed to send email: ${emailError.message}`,
          data: {
            to: interpolatedTo,
            subject: interpolatedSubject,
            sent: false,
            sentAt: new Date().toISOString(),
          },
        };
      }
    } catch (error) {
      this.logger.error(`Email sending failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: `Email node execution failed: ${error.message}`,
      };
    }
  }
}
