import {
  Controller,
  Post,
  Headers,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PaymentProviderFactory } from '../services/payment-provider-factory.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@ApiTags('Payment Webhooks')
@Controller('api/v1/webhooks')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(
    private providerFactory: PaymentProviderFactory,
    private eventEmitter: EventEmitter2,
  ) {}

  @Post('stripe')
  @ApiExcludeEndpoint()
  async handleStripe(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }
    try {
      const provider = await this.providerFactory.getProvider(null, 'stripe');
      const result = await provider.handleWebhook(req.rawBody, signature);
      this.logger.log(`Stripe webhook: ${result.event}`);
      this.eventEmitter.emit(`payment.webhook.${result.event}`, result.data);
      return { received: true };
    } catch (error) {
      this.logger.error(`Stripe webhook error: ${error.message}`);
      throw new BadRequestException('Webhook processing failed');
    }
  }

  @Post('paypal')
  @ApiExcludeEndpoint()
  async handlePayPal(
    @Req() req: any,
    @Headers('paypal-auth-algo') authAlgo: string,
  ) {
    try {
      const provider = await this.providerFactory.getProvider(null, 'paypal');
      const rawBody = Buffer.isBuffer(req.rawBody)
        ? req.rawBody
        : Buffer.from(JSON.stringify(req.body));
      const result = await provider.handleWebhook(rawBody, authAlgo || '');
      this.logger.log(`PayPal webhook: ${result.event}`);
      this.eventEmitter.emit(`payment.webhook.${result.event}`, result.data);
      return { received: true };
    } catch (error) {
      this.logger.error(`PayPal webhook error: ${error.message}`);
      throw new BadRequestException('Webhook processing failed');
    }
  }
}
