import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationConfig } from '../entities/location-config.entity';
import { UpdateLocationConfigDto } from '../dto';

@Injectable()
export class LocationConfigService {
  constructor(
    @InjectRepository(LocationConfig) private configRepo: Repository<LocationConfig>,
  ) {}

  async getConfig(locationId: string): Promise<LocationConfig> {
    let config = await this.configRepo.findOne({ where: { locationId } });
    if (!config) {
      config = this.configRepo.create({ locationId });
      config = await this.configRepo.save(config);
    }
    return config;
  }

  async updateConfig(locationId: string, dto: UpdateLocationConfigDto): Promise<LocationConfig> {
    let config = await this.configRepo.findOne({ where: { locationId } });
    if (!config) {
      config = this.configRepo.create({ locationId, ...dto });
    } else {
      Object.assign(config, dto);
    }
    return this.configRepo.save(config);
  }
}
