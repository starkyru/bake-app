import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationMenu } from '../entities/location-menu.entity';
import { MenuSchedule } from '../entities/menu-schedule.entity';
import { MenuConfig } from '../entities/menu-config.entity';
import { LocationConfig } from '../entities/location-config.entity';
import { DeliveryZone } from '../entities/delivery-zone.entity';
import { Menu } from '../../pos/entities/menu.entity';
import { Location } from '../../inventory/entities/location.entity';
import { ProductOptionGroup } from '../../pos/entities/product-option-group.entity';

@Injectable()
export class OnlineMenuService {
  constructor(
    @InjectRepository(LocationMenu) private locationMenuRepo: Repository<LocationMenu>,
    @InjectRepository(MenuSchedule) private menuScheduleRepo: Repository<MenuSchedule>,
    @InjectRepository(MenuConfig) private menuConfigRepo: Repository<MenuConfig>,
    @InjectRepository(LocationConfig) private locationConfigRepo: Repository<LocationConfig>,
    @InjectRepository(Menu) private menuRepo: Repository<Menu>,
    @InjectRepository(Location) private locationRepo: Repository<Location>,
    @InjectRepository(ProductOptionGroup) private optionGroupRepo: Repository<ProductOptionGroup>,
    @InjectRepository(DeliveryZone) private deliveryZoneRepo: Repository<DeliveryZone>,
  ) {}

  async getOnlineLocations(): Promise<Location[]> {
    const configs = await this.locationConfigRepo.find({
      where: { enabledForOnlineOrdering: true },
      relations: ['location'],
    });

    return configs
      .filter((c) => c.location && c.location.isActive)
      .map((c) => {
        (c.location as any).config = {
          preorderEnabled: c.preorderEnabled,
          deliveryEnabled: c.deliveryEnabled,
          pickupEnabled: c.pickupEnabled,
          shippingEnabled: c.shippingEnabled,
          dineInQrEnabled: c.dineInQrEnabled,
        };
        return c.location;
      });
  }

  async getLocationDetail(locationId: string) {
    const location = await this.locationRepo.findOne({
      where: { id: locationId, isActive: true },
    });
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const config = await this.locationConfigRepo.findOne({
      where: { locationId },
    });

    let deliveryZones: DeliveryZone[] = [];
    if (config?.deliveryEnabled) {
      deliveryZones = await this.deliveryZoneRepo.find({
        where: { locationId, isActive: true },
      });
    }

    return { location, config, deliveryZones };
  }

  async getMenusForLocation(locationId: string, date?: string, time?: string) {
    const locationMenus = await this.locationMenuRepo.find({
      where: { locationId },
      relations: ['menu'],
    });

    if (!locationMenus.length) {
      return { merged: { products: [] }, standalone: [] };
    }

    const now = new Date();
    const targetDate = date ? new Date(date) : now;
    const targetDayOfWeek = targetDate.getDay();
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const targetTime = time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const isFutureDate = date && new Date(date) > now;

    const locationConfig = await this.locationConfigRepo.findOne({
      where: { locationId },
    });

    const activeMenus: Array<{
      menu: Menu;
      config: MenuConfig | null;
    }> = [];

    for (const lm of locationMenus) {
      if (!lm.menu || !lm.menu.isActive) continue;

      const schedules = await this.menuScheduleRepo.find({
        where: { menuId: lm.menuId, isActive: true },
      });

      const menuConfig = await this.menuConfigRepo.findOne({
        where: { menuId: lm.menuId },
      });

      const matchesSchedule = schedules.some((s) => {
        if (s.specificDate) {
          return s.specificDate === targetDateStr &&
            targetTime >= s.startTime &&
            targetTime <= s.endTime;
        }
        if (s.dayOfWeek !== null && s.dayOfWeek !== undefined) {
          return s.dayOfWeek === targetDayOfWeek &&
            targetTime >= s.startTime &&
            targetTime <= s.endTime;
        }
        return targetTime >= s.startTime && targetTime <= s.endTime;
      });

      if (schedules.length === 0 || matchesSchedule) {
        if (isFutureDate) {
          const preorderAllowed =
            locationConfig?.preorderEnabled ||
            menuConfig?.preorderEnabled;
          if (!preorderAllowed) continue;
        }
        activeMenus.push({ menu: lm.menu, config: menuConfig });
      }
    }

    const mergedProducts: any[] = [];
    const standaloneMenus: any[] = [];

    for (const { menu, config } of activeMenus) {
      const fullMenu = await this.menuRepo.findOne({
        where: { id: menu.id },
        relations: ['menuProducts', 'menuProducts.product', 'menuProducts.product.category'],
      });

      if (!fullMenu) continue;

      const products = await Promise.all(
        fullMenu.menuProducts
          .filter((mp) => mp.product && mp.product.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(async (mp) => {
            const optionGroups = await this.optionGroupRepo.find({
              where: { productId: mp.productId },
              relations: ['options'],
              order: { sortOrder: 'ASC' },
            });
            return {
              ...mp.product,
              optionGroups: optionGroups.map((g) => ({
                ...g,
                options: g.options?.filter((o) => o.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
              })),
              sortOrder: mp.sortOrder,
            };
          }),
      );

      const isMerged = config ? config.mergeWithOthers && !config.standalone : true;

      if (isMerged) {
        mergedProducts.push(...products);
      } else {
        standaloneMenus.push({
          menu: { id: menu.id, name: menu.name, description: menu.description },
          products,
          config: config
            ? {
                prepTimeMinutes: config.prepTimeMinutes,
                leadTimeHours: config.leadTimeHours,
                requiresApproval: config.requiresApproval,
                preorderEnabled: config.preorderEnabled,
              }
            : null,
        });
      }
    }

    const groupedByCategory = this.groupByCategory(mergedProducts);

    return {
      merged: { products: mergedProducts, byCategory: groupedByCategory },
      standalone: standaloneMenus,
    };
  }

  async getAvailableDates(locationId: string, daysAhead?: number) {
    const config = await this.locationConfigRepo.findOne({
      where: { locationId },
    });

    const maxDays = daysAhead || config?.preorderDaysAhead || 7;
    const locationMenus = await this.locationMenuRepo.find({
      where: { locationId },
    });

    const menuIds = locationMenus.map((lm) => lm.menuId);
    if (!menuIds.length) return [];

    const schedules = await this.menuScheduleRepo
      .createQueryBuilder('s')
      .where('s.menuId IN (:...menuIds)', { menuIds })
      .andWhere('s.isActive = true')
      .getMany();

    const dates: Array<{ date: string; hasMenus: boolean }> = [];
    const today = new Date();

    for (let i = 0; i <= maxDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();

      const hasMenus = schedules.some((s) => {
        if (s.specificDate) return s.specificDate === dateStr;
        if (s.dayOfWeek !== null && s.dayOfWeek !== undefined) {
          return s.dayOfWeek === dayOfWeek;
        }
        return true;
      });

      dates.push({ date: dateStr, hasMenus });
    }

    return dates;
  }

  private groupByCategory(products: any[]) {
    const groups: Record<string, any[]> = {};
    for (const p of products) {
      const catName = p.category?.name || 'Other';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(p);
    }
    return Object.entries(groups).map(([category, items]) => ({
      category,
      products: items,
    }));
  }
}
