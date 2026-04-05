import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { StorefrontConfig } from '../entities/storefront-config.entity';
import { UpdateStorefrontConfigDto } from '../dto';

@Injectable()
export class StorefrontConfigService {
  constructor(
    @InjectRepository(StorefrontConfig) private configRepo: Repository<StorefrontConfig>,
  ) {}

  async getConfig(locationId: string | null): Promise<StorefrontConfig> {
    const where = locationId ? { locationId } : { locationId: IsNull() as any };
    let config = await this.configRepo.findOne({ where });
    if (!config) {
      config = this.configRepo.create({
        locationId: locationId || undefined,
      });
      config = await this.configRepo.save(config);
    }
    return config;
  }

  async updateConfig(
    locationId: string | null,
    dto: UpdateStorefrontConfigDto,
  ): Promise<StorefrontConfig> {
    const where = locationId ? { locationId } : { locationId: IsNull() as any };
    let config = await this.configRepo.findOne({ where });
    if (!config) {
      config = this.configRepo.create({
        locationId: locationId || undefined,
        ...dto,
      });
    } else {
      Object.assign(config, dto);
    }
    return this.configRepo.save(config);
  }
}
