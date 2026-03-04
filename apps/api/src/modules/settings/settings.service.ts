import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting) private settingRepo: Repository<Setting>,
  ) {}

  async getGroup(group: string): Promise<Record<string, string>> {
    const settings = await this.settingRepo.find({ where: { group } });
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async saveGroup(group: string, data: Record<string, string>): Promise<Record<string, string>> {
    for (const [key, value] of Object.entries(data)) {
      const existing = await this.settingRepo.findOne({ where: { key } });
      if (existing) {
        existing.value = value;
        existing.group = group;
        await this.settingRepo.save(existing);
      } else {
        await this.settingRepo.save(this.settingRepo.create({ key, value, group }));
      }
    }
    return this.getGroup(group);
  }
}
