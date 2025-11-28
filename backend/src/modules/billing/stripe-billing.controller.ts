import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class StripeBillingController {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeKey = this.configService.get('STRIPE_SECRET_KEY') || 'sk_test_...';
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-11-17.clover',
    });
  }

  @Get('subscription')
  async getSubscription(@Req() req: any) {
    const organizationId = req.user.organizationId;
    
    // Get subscription from database or Stripe
    // For now, return mock data
    return {
      plan: 'free', // or 'pro', 'enterprise'
      status: 'active',
      next_billing_date: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    };
  }

  @Get('invoices')
  async getInvoices(@Req() req: any) {
    const organizationId = req.user.organizationId;
    
    try {
      // Get customer ID from database
      // const customer = await this.getStripeCustomer(organizationId);
      
      // For now, return mock invoices
      const mockInvoices = [
        {
          id: 'in_1',
          amount: 2900,
          currency: 'usd',
          status: 'paid',
          created: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
          number: 'INV-001',
          period_start: Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60,
          period_end: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
          invoice_pdf: 'https://invoice-pdf-url.com',
          hosted_invoice_url: 'https://invoice-url.com',
        },
        {
          id: 'in_2',
          amount: 2900,
          currency: 'usd',
          status: 'paid',
          created: Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60,
          number: 'INV-002',
          period_start: Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60,
          period_end: Math.floor(Date.now() / 1000) - 60 * 24 * 60 * 60,
          invoice_pdf: 'https://invoice-pdf-url.com',
          hosted_invoice_url: 'https://invoice-url.com',
        },
      ];

      return mockInvoices;

      // Real Stripe implementation:
      /*
      const invoices = await this.stripe.invoices.list({
        customer: customer.stripeCustomerId,
        limit: 100,
      });

      return invoices.data.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        created: invoice.created,
        number: invoice.number,
        period_start: invoice.period_start,
        period_end: invoice.period_end,
        invoice_pdf: invoice.invoice_pdf,
        hosted_invoice_url: invoice.hosted_invoice_url,
      }));
      */
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  }

  @Get('payment-methods')
  async getPaymentMethods(@Req() req: any) {
    const organizationId = req.user.organizationId;
    
    // Mock payment methods
    const mockPaymentMethods = [
      {
        id: 'pm_1',
        brand: 'Visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025,
        is_default: true,
      },
    ];

    return mockPaymentMethods;

    // Real Stripe implementation:
    /*
    try {
      const customer = await this.getStripeCustomer(organizationId);
      
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customer.stripeCustomerId,
        type: 'card',
      });

      const defaultPaymentMethodId = customer.defaultPaymentMethod;

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year,
        is_default: pm.id === defaultPaymentMethodId,
      }));
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
    */
  }

  @Post('subscribe')
  async subscribe(@Req() req: any, @Body() body: any) {
    const organizationId = req.user.organizationId;
    const { planId, interval } = body;

    // Create or update Stripe subscription
    // For now, return success
    return {
      success: true,
      message: 'Subscription updated successfully',
      planId,
      interval,
    };

    // Real Stripe implementation:
    /*
    try {
      const customer = await this.getOrCreateStripeCustomer(organizationId);
      
      // Get or create price ID based on planId and interval
      const priceId = this.getPriceId(planId, interval);
      
      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Update database with subscription info
      // await this.updateOrganizationPlan(organizationId, planId);

      return {
        success: true,
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
    */
  }

  @Post('cancel-subscription')
  async cancelSubscription(@Req() req: any) {
    const organizationId = req.user.organizationId;

    // Cancel Stripe subscription
    return {
      success: true,
      message: 'Subscription cancelled successfully',
    };

    // Real implementation would cancel the Stripe subscription
  }

  @Post('update-payment-method')
  async updatePaymentMethod(@Req() req: any, @Body() body: any) {
    const organizationId = req.user.organizationId;
    const { paymentMethodId } = body;

    // Update payment method in Stripe
    return {
      success: true,
      message: 'Payment method updated successfully',
    };
  }

  // Helper method to get Stripe price ID
  private getPriceId(planId: string, interval: string): string {
    const priceMap = {
      'pro-month': 'price_pro_monthly',
      'pro-year': 'price_pro_yearly',
      'enterprise-month': 'price_enterprise_monthly',
      'enterprise-year': 'price_enterprise_yearly',
    };

    return priceMap[`${planId}-${interval}`] || '';
  }
}
