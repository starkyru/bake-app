import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorefrontPaymentConfig } from '../online-ordering/entities/storefront-payment-config.entity';
import { PaymentProviderFactory } from './services/payment-provider-factory.service';
import { PaymentConfigService } from './services/payment-config.service';
import { PaymentWebhookController } from './controllers/payment-webhook.controller';
import { AdminPaymentConfigController } from './controllers/admin-payment-config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StorefrontPaymentConfig])],
  controllers: [PaymentWebhookController, AdminPaymentConfigController],
  providers: [PaymentProviderFactory, PaymentConfigService],
  exports: [PaymentProviderFactory],
})
export class PaymentProvidersModule {}
