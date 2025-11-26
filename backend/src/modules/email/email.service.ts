import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get('EMAIL_FROM', 'noreply@example.com');
    this.fromName = this.configService.get('EMAIL_FROM_NAME', 'AI Platform');

    this.initializeTransporter();
  }

  private initializeTransporter() {
    const apiKey = this.configService.get('SENDGRID_API_KEY');

    if (!apiKey) {
      this.logger.warn('SendGrid API key not configured. Email sending disabled.');
      return;
    }

    // SendGrid SMTP configuration
    this.transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: apiKey,
      },
    });

    this.logger.log('Email service initialized with SendGrid');
  }

  /**
   * Send email with template
   */
  async send(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email not sent - transporter not configured');
      return;
    }

    try {
      const html = await this.renderTemplate(options.template, options.context);

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html,
      });

      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcome(email: string, name: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Welcome to AI Platform!',
      template: 'welcome',
      context: { name },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, resetToken: string, resetUrl: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Reset Your Password',
      template: 'password-reset',
      context: { resetToken, resetUrl },
    });
  }

  /**
   * Send job completion email
   */
  async sendJobComplete(email: string, jobName: string, jobId: string, jobUrl: string): Promise<void> {
    await this.send({
      to: email,
      subject: `Job Complete: ${jobName}`,
      template: 'job-complete',
      context: { jobName, jobId, jobUrl },
    });
  }

  /**
   * Render email template
   */
  private async renderTemplate(templateName: string, context: Record<string, any>): Promise<string> {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.hbs`);
    
    // Fallback to simple HTML if template doesn't exist
    if (!fs.existsSync(templatePath)) {
      return this.renderFallback(templateName, context);
    }

    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    
    return template(context);
  }

  /**
   * Fallback HTML when template not found
   */
  private renderFallback(templateName: string, context: Record<string, any>): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.fromName}</h1>
            </div>
            <div class="content">
              <pre>${JSON.stringify(context, null, 2)}</pre>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${this.fromName}. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
