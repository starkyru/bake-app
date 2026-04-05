import { PaymentProviderInterface } from '../interfaces/payment-provider.interface';

let Stripe: any;
try {
  Stripe = require('stripe');
} catch {
  // stripe package not installed - provider will throw on use
}

export class StripeProvider implements PaymentProviderInterface {
  private stripe: any;
  private webhookSecret?: string;

  constructor(apiKey: string, webhookSecret?: string) {
    if (!Stripe) {
      throw new Error('stripe package is not installed. Run: npm install stripe');
    }
    this.stripe = new Stripe(apiKey, { apiVersion: '2024-06-20' });
    this.webhookSecret = webhookSecret;
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<{ clientSecret: string; transactionId: string }> {
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata,
    });
    return {
      clientSecret: intent.client_secret,
      transactionId: intent.id,
    };
  }

  async confirmPayment(
    transactionId: string,
  ): Promise<{ status: string; providerReference: string }> {
    const intent = await this.stripe.paymentIntents.retrieve(transactionId);
    return {
      status: intent.status,
      providerReference: intent.id,
    };
  }

  async refund(
    transactionId: string,
    amount?: number,
  ): Promise<{ refundId: string }> {
    const params: any = { payment_intent: transactionId };
    if (amount !== undefined) {
      params.amount = Math.round(amount * 100);
    }
    const refund = await this.stripe.refunds.create(params);
    return { refundId: refund.id };
  }

  async handleWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<{ event: string; data: Record<string, unknown> }> {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured for Stripe');
    }
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );
    return {
      event: event.type,
      data: event.data.object as Record<string, unknown>,
    };
  }
}
