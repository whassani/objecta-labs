import {
  Controller,
  Post,
  Headers,
  RawBodyRequest,
  Request,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { Invoice } from './entities/invoice.entity';
import { User } from '../auth/entities/user.entity';
import { EmailService } from '../email/email.service';

@ApiTags('billing-webhooks')
@Controller('api/v1/billing/webhooks')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Invoice)
    private invoicesRepository: Repository<Invoice>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, {
        apiVersion: '2025-11-17.clover' as any,
      });
    }
  }

  @Post('stripe')
  @ApiExcludeEndpoint()
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Request() req: RawBodyRequest<Request>,
  ) {
    if (!this.stripe || !this.webhookSecret) {
      throw new BadRequestException('Stripe is not configured');
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Processing webhook event: ${event.type}`);

    // Handle the event
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.finalized':
          await this.handleInvoiceFinalized(event.data.object as Stripe.Invoice);
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      throw new BadRequestException('Error processing webhook');
    }
  }

  private async handleSubscriptionUpdate(stripeSubscription: Stripe.Subscription) {
    const organizationId = stripeSubscription.metadata.organizationId;

    if (!organizationId) {
      this.logger.warn('Subscription missing organizationId in metadata');
      return;
    }

    let subscription = await this.subscriptionsRepository.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    const subscriptionData: Partial<Subscription> = {
      organizationId,
      stripeCustomerId: stripeSubscription.customer as string,
      stripeSubscriptionId: stripeSubscription.id,
      status: stripeSubscription.status as SubscriptionStatus,
      currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (stripeSubscription as any).cancel_at_period_end,
      trialEnd: (stripeSubscription as any).trial_end 
        ? new Date((stripeSubscription as any).trial_end * 1000) 
        : null,
    };

    if (subscription) {
      Object.assign(subscription, subscriptionData);
      await this.subscriptionsRepository.save(subscription);
    } else {
      subscription = this.subscriptionsRepository.create(subscriptionData);
      await this.subscriptionsRepository.save(subscription);
    }
    this.logger.log(`Subscription updated for organization: ${organizationId}`);
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.plan = 'free';
      await this.subscriptionsRepository.save(subscription);
      this.logger.log(`Subscription canceled for organization: ${subscription.organizationId}`);
    }
  }

  private async handleInvoicePaymentSucceeded(stripeInvoice: Stripe.Invoice) {
    const organizationId = stripeInvoice.metadata?.organizationId;

    if (!organizationId) {
      this.logger.warn('Invoice missing organizationId in metadata');
      return;
    }

    // Find subscription
    const subscription = await this.subscriptionsRepository.findOne({
      where: { stripeCustomerId: stripeInvoice.customer as string },
    });

    // Create or update invoice record
    let invoice = await this.invoicesRepository.findOne({
      where: { stripeInvoiceId: stripeInvoice.id },
    });

    const invoiceData = {
      organizationId,
      subscriptionId: subscription?.id,
      stripeInvoiceId: stripeInvoice.id,
      amount: (stripeInvoice as any).amount_paid / 100, // Convert cents to dollars
      status: 'paid',
      invoicePdf: (stripeInvoice as any).invoice_pdf,
      dueDate: new Date((stripeInvoice as any).due_date * 1000),
      paidAt: new Date(),
    };

    if (invoice) {
      Object.assign(invoice, invoiceData);
    } else {
      invoice = this.invoicesRepository.create(invoiceData);
    }

    await this.invoicesRepository.save(invoice);
    this.logger.log(`Invoice payment succeeded for organization: ${organizationId}`);

    // Send payment success email
    try {
      const users = await this.usersRepository.find({
        where: { organizationId },
      });

      const adminUser = users[0]; // Send to first user (primary account owner)
      
      if (adminUser?.email) {
        await this.emailService.sendPaymentSuccess({
          email: adminUser.email,
          amount: (stripeInvoice as any).amount_paid / 100,
          invoiceId: stripeInvoice.id,
          paymentDate: new Date(stripeInvoice.status_transitions.paid_at * 1000).toLocaleDateString(),
          paymentMethod: 'Card',
          invoiceUrl: (stripeInvoice as any).hosted_invoice_url || '#',
        });

        this.logger.log(`Payment success email sent to ${adminUser.email}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send payment success email: ${error.message}`);
    }
  }

  private async handleInvoicePaymentFailed(stripeInvoice: Stripe.Invoice) {
    const organizationId = stripeInvoice.metadata?.organizationId;

    if (!organizationId) {
      this.logger.warn('Invoice missing organizationId in metadata');
      return;
    }

    this.logger.warn(`Invoice payment failed for organization: ${organizationId}`);

    // Send payment failure notification
    try {
      const users = await this.usersRepository.find({
        where: { organizationId },
      });

      const adminUser = users[0];
      
      if (adminUser?.email) {
        await this.emailService.sendPaymentFailed({
          email: adminUser.email,
          amount: (stripeInvoice as any).amount_due / 100,
          invoiceId: stripeInvoice.id,
          attemptDate: new Date().toLocaleDateString(),
          reason: stripeInvoice.last_finalization_error?.message,
        });

        this.logger.log(`Payment failure email sent to ${adminUser.email}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send payment failure email: ${error.message}`);
    }

    // Update subscription status if needed
    const subscription = await this.subscriptionsRepository.findOne({
      where: { stripeCustomerId: stripeInvoice.customer as string },
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.PAST_DUE;
      await this.subscriptionsRepository.save(subscription);
      this.logger.log(`Subscription marked as past_due for organization: ${organizationId}`);
    }
  }

  private async handleInvoiceFinalized(stripeInvoice: Stripe.Invoice) {
    const organizationId = stripeInvoice.metadata?.organizationId;

    if (!organizationId) {
      this.logger.warn('Invoice missing organizationId in metadata');
      return;
    }

    // Find subscription
    const subscription = await this.subscriptionsRepository.findOne({
      where: { stripeCustomerId: stripeInvoice.customer as string },
    });

    // Create invoice record
    const invoice = this.invoicesRepository.create({
      organizationId,
      subscriptionId: subscription?.id,
      stripeInvoiceId: stripeInvoice.id,
      amount: (stripeInvoice as any).amount_due / 100,
      status: stripeInvoice.status,
      invoicePdf: (stripeInvoice as any).invoice_pdf,
      dueDate: new Date((stripeInvoice as any).due_date * 1000),
    });

    await this.invoicesRepository.save(invoice);
    this.logger.log(`Invoice finalized for organization: ${organizationId}`);
  }
}
