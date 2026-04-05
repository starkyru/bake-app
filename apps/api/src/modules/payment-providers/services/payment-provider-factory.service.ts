import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorefrontPaymentConfig } from '../../online-ordering/entities/storefront-payment-config.entity';
import { PaymentProviderInterface } from '../interfaces/payment-provider.interface';
import { StripeProvider } from '../providers/stripe.provider';
import { PayPalProvider } from '../providers/paypal.provider';
import { decrypt } from './encryption.util';

@Injectable()
export class PaymentProviderFactory {
  constructor(
    @InjectRepository(StorefrontPaymentConfig)
    private configRepo: Repository<StorefrontPaymentConfig>,
  ) {}

  async getProvider(
    locationId: string | null,
    providerType: string,
  ): Promise<PaymentProviderInterface> {
    const where: any = { provider: providerType, isActive: true };
    if (locationId) {
      where.locationId = locationId;
    }
    const config = await this.configRepo.findOne({ where });
    if (!config) {
      throw new NotFoundException(
        `No active ${providerType} payment config found${locationId ? ` for location ${locationId}` : ''}`,
      );
    }

    const decryptedKey = decrypt(config.secretKeyEncrypted);
    const decryptedWebhookSecret = config.webhookSecret
      ? decrypt(config.webhookSecret)
      : undefined;

    switch (providerType) {
      case 'stripe':
        return new StripeProvider(decryptedKey, decryptedWebhookSecret);
      case 'paypal':
        return new PayPalProvider(
          decryptedKey,
          config.publicKey,
          config.isSandbox,
          decryptedWebhookSecret,
        );
      default:
        throw new BadRequestException(`Unknown payment provider: ${providerType}`);
    }
  }
}
