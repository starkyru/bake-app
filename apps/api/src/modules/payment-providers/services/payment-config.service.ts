import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorefrontPaymentConfig } from '../../online-ordering/entities/storefront-payment-config.entity';
import { CreatePaymentConfigDto, UpdatePaymentConfigDto } from '../../online-ordering/dto';
import { encrypt } from './encryption.util';

@Injectable()
export class PaymentConfigService {
  constructor(
    @InjectRepository(StorefrontPaymentConfig)
    private configRepo: Repository<StorefrontPaymentConfig>,
  ) {}

  async findAll(): Promise<StorefrontPaymentConfig[]> {
    const configs = await this.configRepo.find({ order: { createdAt: 'DESC' } });
    return configs.map((c) => ({
      ...c,
      secretKeyEncrypted: '***',
      webhookSecret: c.webhookSecret ? '***' : null,
    } as StorefrontPaymentConfig));
  }

  async create(dto: CreatePaymentConfigDto): Promise<StorefrontPaymentConfig> {
    const config = this.configRepo.create({
      locationId: dto.locationId,
      provider: dto.provider,
      publicKey: dto.publicKey,
      secretKeyEncrypted: encrypt(dto.secretKey),
      webhookSecret: dto.webhookSecret ? encrypt(dto.webhookSecret) : undefined,
      isSandbox: dto.isSandbox ?? true,
      isActive: false,
    });
    const saved = await this.configRepo.save(config);
    saved.secretKeyEncrypted = '***';
    if (saved.webhookSecret) saved.webhookSecret = '***';
    return saved;
  }

  async update(id: string, dto: UpdatePaymentConfigDto): Promise<StorefrontPaymentConfig> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Payment config not found');

    if (dto.publicKey !== undefined) config.publicKey = dto.publicKey;
    if (dto.secretKey !== undefined) config.secretKeyEncrypted = encrypt(dto.secretKey);
    if (dto.webhookSecret !== undefined) config.webhookSecret = encrypt(dto.webhookSecret);
    if (dto.isSandbox !== undefined) config.isSandbox = dto.isSandbox;
    if (dto.provider !== undefined) config.provider = dto.provider;
    if (dto.locationId !== undefined) config.locationId = dto.locationId;

    const saved = await this.configRepo.save(config);
    saved.secretKeyEncrypted = '***';
    if (saved.webhookSecret) saved.webhookSecret = '***';
    return saved;
  }

  async delete(id: string): Promise<void> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Payment config not found');
    await this.configRepo.remove(config);
  }

  async activate(id: string): Promise<StorefrontPaymentConfig> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Payment config not found');
    config.isActive = true;
    return this.configRepo.save(config);
  }

  async deactivate(id: string): Promise<StorefrontPaymentConfig> {
    const config = await this.configRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException('Payment config not found');
    config.isActive = false;
    return this.configRepo.save(config);
  }
}
