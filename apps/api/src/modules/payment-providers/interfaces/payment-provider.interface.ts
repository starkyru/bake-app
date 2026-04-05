export interface PaymentProviderInterface {
  createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>,
  ): Promise<{ clientSecret: string; transactionId: string }>;

  confirmPayment(
    transactionId: string,
  ): Promise<{ status: string; providerReference: string }>;

  refund(
    transactionId: string,
    amount?: number,
  ): Promise<{ refundId: string }>;

  handleWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<{ event: string; data: Record<string, unknown> }>;
}
