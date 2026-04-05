import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentProviderFactory } from './payment-provider-factory.service';
import { StorefrontPaymentConfig } from '../../online-ordering/entities/storefront-payment-config.entity';

// Mock the encryption util
jest.mock('./encryption.util', () => ({
  decrypt: jest.fn().mockReturnValue('decrypted-secret-key'),
}));

// Mock stripe to avoid real dependency
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: { create: jest.fn(), retrieve: jest.fn() },
    refunds: { create: jest.fn() },
    webhooks: { constructEvent: jest.fn() },
  }));
}, { virtual: true });

describe('PaymentProviderFactory', () => {
  let factory: PaymentProviderFactory;
  let configRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    configRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentProviderFactory,
        { provide: getRepositoryToken(StorefrontPaymentConfig), useValue: configRepo },
      ],
    }).compile();

    factory = module.get<PaymentProviderFactory>(PaymentProviderFactory);
  });

  describe('getProvider', () => {
    it('should return StripeProvider for stripe type', async () => {
      configRepo.findOne.mockResolvedValue({
        id: 'cfg-1',
        provider: 'stripe',
        secretKeyEncrypted: 'enc:key',
        publicKey: 'pk_test_123',
        webhookSecret: 'whsec_123',
        isActive: true,
        isSandbox: true,
      });

      const provider = await factory.getProvider('loc-1', 'stripe');

      expect(provider).toBeDefined();
      expect(provider.createPaymentIntent).toBeDefined();
      expect(provider.confirmPayment).toBeDefined();
      expect(provider.refund).toBeDefined();
    });

    it('should return PayPalProvider for paypal type', async () => {
      configRepo.findOne.mockResolvedValue({
        id: 'cfg-2',
        provider: 'paypal',
        secretKeyEncrypted: 'enc:key',
        publicKey: 'paypal-client-id',
        webhookSecret: 'webhook-id',
        isActive: true,
        isSandbox: true,
      });

      const provider = await factory.getProvider('loc-1', 'paypal');

      expect(provider).toBeDefined();
      expect(provider.createPaymentIntent).toBeDefined();
    });

    it('should throw NotFoundException if no active config found', async () => {
      configRepo.findOne.mockResolvedValue(null);

      await expect(
        factory.getProvider('loc-1', 'stripe'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for unknown provider type', async () => {
      configRepo.findOne.mockResolvedValue({
        id: 'cfg-3',
        provider: 'bitcoin',
        secretKeyEncrypted: 'enc:key',
        publicKey: 'pub',
        isActive: true,
      });

      await expect(
        factory.getProvider('loc-1', 'bitcoin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should search without locationId when null', async () => {
      configRepo.findOne.mockResolvedValue({
        id: 'cfg-1',
        provider: 'paypal',
        secretKeyEncrypted: 'enc:key',
        publicKey: 'client-id',
        webhookSecret: null,
        isActive: true,
        isSandbox: true,
      });

      await factory.getProvider(null, 'paypal');

      expect(configRepo.findOne).toHaveBeenCalledWith({
        where: { provider: 'paypal', isActive: true },
      });
    });
  });
});
