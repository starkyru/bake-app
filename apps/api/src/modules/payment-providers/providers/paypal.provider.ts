import { PaymentProviderInterface } from '../interfaces/payment-provider.interface';

export class PayPalProvider implements PaymentProviderInterface {
  private clientId: string;
  private secretKey: string;
  private baseUrl: string;
  private webhookId?: string;

  constructor(secretKey: string, clientId: string, sandbox = true, webhookId?: string) {
    this.clientId = clientId;
    this.secretKey = secretKey;
    this.baseUrl = sandbox
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
    this.webhookId = webhookId;
  }

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.clientId}:${this.secretKey}`).toString('base64');
    const res = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) {
      throw new Error(`PayPal auth failed: ${res.status}`);
    }
    const data = await res.json();
    return data.access_token;
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<{ clientSecret: string; transactionId: string }> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency.toUpperCase(),
              value: amount.toFixed(2),
            },
            custom_id: metadata.orderId || '',
          },
        ],
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`PayPal create order failed: ${err}`);
    }
    const data = await res.json();
    return {
      clientSecret: data.id,
      transactionId: data.id,
    };
  }

  async confirmPayment(
    transactionId: string,
  ): Promise<{ status: string; providerReference: string }> {
    const token = await this.getAccessToken();
    const res = await fetch(
      `${this.baseUrl}/v2/checkout/orders/${transactionId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`PayPal capture failed: ${err}`);
    }
    const data = await res.json();
    return {
      status: data.status,
      providerReference: data.id,
    };
  }

  async refund(
    transactionId: string,
    amount?: number,
    currency = 'USD',
  ): Promise<{ refundId: string }> {
    const token = await this.getAccessToken();
    const body: any = {};
    if (amount !== undefined) {
      body.amount = {
        currency_code: currency.toUpperCase(),
        value: amount.toFixed(2),
      };
    }
    const res = await fetch(
      `${this.baseUrl}/v2/payments/captures/${transactionId}/refund`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`PayPal refund failed: ${err}`);
    }
    const data = await res.json();
    return { refundId: data.id };
  }

  async handleWebhook(
    rawBody: Buffer,
    signature: string,
    headers?: Record<string, string | string[] | undefined>,
  ): Promise<{ event: string; data: Record<string, unknown> }> {
    const token = await this.getAccessToken();
    const webhookEvent = JSON.parse(rawBody.toString());
    const transmissionId = this.getHeader(headers, 'paypal-transmission-id');
    const transmissionSig = this.getHeader(headers, 'paypal-transmission-sig');
    const transmissionTime = this.getHeader(headers, 'paypal-transmission-time');
    const certUrl = this.getHeader(headers, 'paypal-cert-url');

    if (
      !signature ||
      !transmissionId ||
      !transmissionSig ||
      !transmissionTime ||
      !certUrl ||
      !this.webhookId
    ) {
      throw new Error('Missing PayPal webhook verification data');
    }

    const verifyRes = await fetch(
      `${this.baseUrl}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_algo: signature,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: this.webhookId,
          webhook_event: webhookEvent,
        }),
      },
    );

    if (!verifyRes.ok) {
      throw new Error('PayPal webhook verification failed');
    }

    const verification = await verifyRes.json() as { verification_status?: string };
    if (verification.verification_status !== 'SUCCESS') {
      throw new Error('PayPal webhook signature check failed');
    }

    return {
      event: webhookEvent.event_type,
      data: webhookEvent.resource as Record<string, unknown>,
    };
  }

  private getHeader(
    headers: Record<string, string | string[] | undefined> | undefined,
    name: string,
  ): string | undefined {
    const value = headers?.[name];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }
}
