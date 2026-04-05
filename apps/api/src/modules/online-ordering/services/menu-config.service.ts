import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuConfig } from '../entities/menu-config.entity';
import { MenuSchedule } from '../entities/menu-schedule.entity';
import { LocationMenu } from '../entities/location-menu.entity';
import { MenuTag } from '../entities/menu-tag.entity';
import { UpdateMenuConfigDto, CreateMenuScheduleDto, UpdateMenuScheduleDto } from '../dto';

@Injectable()
export class MenuConfigService {
  constructor(
    @InjectRepository(MenuConfig) private configRepo: Repository<MenuConfig>,
    @InjectRepository(MenuSchedule) private scheduleRepo: Repository<MenuSchedule>,
    @InjectRepository(LocationMenu) private locationMenuRepo: Repository<LocationMenu>,
    @InjectRepository(MenuTag) private tagRepo: Repository<MenuTag>,
  ) {}

  async getConfig(menuId: string): Promise<MenuConfig> {
    let config = await this.configRepo.findOne({ where: { menuId } });
    if (!config) {
      config = this.configRepo.create({ menuId });
      config = await this.configRepo.save(config);
    }
    return config;
  }

  async updateConfig(menuId: string, dto: UpdateMenuConfigDto): Promise<MenuConfig> {
    let config = await this.configRepo.findOne({ where: { menuId } });
    if (!config) {
      config = this.configRepo.create({ menuId, ...dto });
    } else {
      Object.assign(config, dto);
    }
    return this.configRepo.save(config);
  }

  async getLocationMenus(locationId: string): Promise<LocationMenu[]> {
    return this.locationMenuRepo.find({
      where: { locationId },
      relations: ['menu'],
    });
  }

  async assignMenuToLocation(locationId: string, menuId: string): Promise<LocationMenu> {
    const existing = await this.locationMenuRepo.findOne({
      where: { locationId, menuId },
    });
    if (existing) {
      throw new ConflictException('Menu is already assigned to this location');
    }
    return this.locationMenuRepo.save(
      this.locationMenuRepo.create({ locationId, menuId }),
    );
  }

  async unassignMenuFromLocation(locationId: string, menuId: string): Promise<void> {
    const lm = await this.locationMenuRepo.findOne({
      where: { locationId, menuId },
    });
    if (!lm) throw new NotFoundException('Menu is not assigned to this location');
    await this.locationMenuRepo.remove(lm);
  }

  async getSchedules(menuId: string): Promise<MenuSchedule[]> {
    return this.scheduleRepo.find({
      where: { menuId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async createSchedule(menuId: string, dto: CreateMenuScheduleDto): Promise<MenuSchedule> {
    return this.scheduleRepo.save(
      this.scheduleRepo.create({ menuId, ...dto }),
    );
  }

  async updateSchedule(scheduleId: string, dto: UpdateMenuScheduleDto): Promise<MenuSchedule> {
    const schedule = await this.scheduleRepo.findOne({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Schedule not found');
    Object.assign(schedule, dto);
    return this.scheduleRepo.save(schedule);
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    const schedule = await this.scheduleRepo.findOne({ where: { id: scheduleId } });
    if (!schedule) throw new NotFoundException('Schedule not found');
    await this.scheduleRepo.remove(schedule);
  }

  async getMenuTags(menuId: string): Promise<MenuTag[]> {
    return this.tagRepo
      .createQueryBuilder('tag')
      .innerJoin('tag.menus', 'menu', 'menu.id = :menuId', { menuId })
      .getMany();
  }

  async setMenuTags(menuId: string, tagIds: string[]): Promise<MenuTag[]> {
    const tags = tagIds.length > 0
      ? await this.tagRepo.findByIds(tagIds)
      : [];

    const allTags = await this.tagRepo
      .createQueryBuilder('tag')
      .leftJoinAndSelect('tag.menus', 'menu')
      .getMany();

    for (const tag of allTags) {
      const menuIds = tag.menus.map((m) => m.id);
      const isCurrentlyLinked = menuIds.includes(menuId);
      const shouldBeLinked = tags.some((t) => t.id === tag.id);

      if (isCurrentlyLinked && !shouldBeLinked) {
        tag.menus = tag.menus.filter((m) => m.id !== menuId);
        await this.tagRepo.save(tag);
      } else if (!isCurrentlyLinked && shouldBeLinked) {
        const menu = { id: menuId } as any;
        tag.menus.push(menu);
        await this.tagRepo.save(tag);
      }
    }

    return this.getMenuTags(menuId);
  }
}
