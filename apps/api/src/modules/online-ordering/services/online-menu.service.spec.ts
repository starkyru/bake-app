import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OnlineMenuService } from './online-menu.service';
import { LocationMenu } from '../entities/location-menu.entity';
import { MenuSchedule } from '../entities/menu-schedule.entity';
import { MenuConfig } from '../entities/menu-config.entity';
import { LocationConfig } from '../entities/location-config.entity';
import { DeliveryZone } from '../entities/delivery-zone.entity';
import { Menu } from '../../pos/entities/menu.entity';
import { Location } from '../../inventory/entities/location.entity';
import { ProductOptionGroup } from '../../pos/entities/product-option-group.entity';

describe('OnlineMenuService', () => {
  let service: OnlineMenuService;
  let locationMenuRepo: Record<string, jest.Mock>;
  let menuScheduleRepo: Record<string, jest.Mock>;
  let menuConfigRepo: Record<string, jest.Mock>;
  let locationConfigRepo: Record<string, jest.Mock>;
  let menuRepo: Record<string, jest.Mock>;
  let locationRepo: Record<string, jest.Mock>;
  let optionGroupRepo: Record<string, jest.Mock>;
  let deliveryZoneRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    locationMenuRepo = { find: jest.fn() };
    menuScheduleRepo = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    menuConfigRepo = { findOne: jest.fn() };
    locationConfigRepo = { find: jest.fn(), findOne: jest.fn() };
    menuRepo = { findOne: jest.fn() };
    locationRepo = { findOne: jest.fn() };
    optionGroupRepo = { find: jest.fn() };
    deliveryZoneRepo = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnlineMenuService,
        { provide: getRepositoryToken(LocationMenu), useValue: locationMenuRepo },
        { provide: getRepositoryToken(MenuSchedule), useValue: menuScheduleRepo },
        { provide: getRepositoryToken(MenuConfig), useValue: menuConfigRepo },
        { provide: getRepositoryToken(LocationConfig), useValue: locationConfigRepo },
        { provide: getRepositoryToken(Menu), useValue: menuRepo },
        { provide: getRepositoryToken(Location), useValue: locationRepo },
        { provide: getRepositoryToken(ProductOptionGroup), useValue: optionGroupRepo },
        { provide: getRepositoryToken(DeliveryZone), useValue: deliveryZoneRepo },
      ],
    }).compile();

    service = module.get<OnlineMenuService>(OnlineMenuService);
  });

  describe('getOnlineLocations', () => {
    it('should return only locations with enabledForOnlineOrdering=true', async () => {
      const loc1 = { id: 'loc-1', name: 'Downtown', isActive: true };
      const loc2 = { id: 'loc-2', name: 'Mall', isActive: true };
      locationConfigRepo.find.mockResolvedValue([
        { enabledForOnlineOrdering: true, location: loc1, preorderEnabled: true, deliveryEnabled: false, pickupEnabled: true, shippingEnabled: false, dineInQrEnabled: false },
        { enabledForOnlineOrdering: true, location: loc2, preorderEnabled: false, deliveryEnabled: true, pickupEnabled: true, shippingEnabled: false, dineInQrEnabled: false },
      ]);

      const result = await service.getOnlineLocations();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('loc-1');
      expect(result[1].id).toBe('loc-2');
    });

    it('should filter out locations with inactive isActive flag', async () => {
      locationConfigRepo.find.mockResolvedValue([
        { enabledForOnlineOrdering: true, location: { id: 'loc-1', isActive: false }, preorderEnabled: false, deliveryEnabled: false, pickupEnabled: true, shippingEnabled: false, dineInQrEnabled: false },
      ]);

      const result = await service.getOnlineLocations();

      expect(result).toHaveLength(0);
    });

    it('should filter out configs with null location', async () => {
      locationConfigRepo.find.mockResolvedValue([
        { enabledForOnlineOrdering: true, location: null, preorderEnabled: false, deliveryEnabled: false, pickupEnabled: true, shippingEnabled: false, dineInQrEnabled: false },
      ]);

      const result = await service.getOnlineLocations();

      expect(result).toHaveLength(0);
    });
  });

  describe('getMenusForLocation', () => {
    const makeLocationMenu = (menuId: string, menu: any) => ({
      locationId: 'loc-1',
      menuId,
      menu,
    });

    const makeMenu = (id: string, name: string, isActive = true) => ({
      id,
      name,
      description: `${name} desc`,
      isActive,
    });

    it('should return empty when no location menus found', async () => {
      locationMenuRepo.find.mockResolvedValue([]);

      const result = await service.getMenusForLocation('loc-1');

      expect(result).toEqual({ merged: { products: [] }, standalone: [] });
    });

    it('should return menus matching current day/time schedule', async () => {
      const menu = makeMenu('menu-1', 'Morning');
      locationMenuRepo.find.mockResolvedValue([makeLocationMenu('menu-1', menu)]);

      const now = new Date();
      menuScheduleRepo.find.mockResolvedValue([
        {
          dayOfWeek: now.getDay(),
          startTime: '00:00',
          endTime: '23:59',
          isActive: true,
          specificDate: null,
        },
      ]);

      menuConfigRepo.findOne.mockResolvedValue(null);
      locationConfigRepo.findOne.mockResolvedValue(null);
      menuRepo.findOne.mockResolvedValue({
        id: 'menu-1',
        menuProducts: [
          {
            productId: 'p1',
            sortOrder: 0,
            product: { id: 'p1', name: 'Croissant', isActive: true, price: 50, category: { name: 'Pastries' } },
          },
        ],
      });
      optionGroupRepo.find.mockResolvedValue([]);

      const result = await service.getMenusForLocation('loc-1');

      expect(result.merged.products).toHaveLength(1);
      expect(result.merged.products[0].name).toBe('Croissant');
    });

    it('should filter out menus not matching schedule', async () => {
      const menu = makeMenu('menu-1', 'Morning');
      locationMenuRepo.find.mockResolvedValue([makeLocationMenu('menu-1', menu)]);

      // Schedule for a different day
      const now = new Date();
      const differentDay = (now.getDay() + 3) % 7;
      menuScheduleRepo.find.mockResolvedValue([
        {
          dayOfWeek: differentDay,
          startTime: '00:00',
          endTime: '23:59',
          isActive: true,
          specificDate: null,
        },
      ]);
      menuConfigRepo.findOne.mockResolvedValue(null);
      locationConfigRepo.findOne.mockResolvedValue(null);

      const result = await service.getMenusForLocation('loc-1');

      expect(result.merged.products).toHaveLength(0);
      expect(result.standalone).toHaveLength(0);
    });

    it('should separate merged vs standalone menus correctly', async () => {
      const mergedMenu = makeMenu('menu-1', 'Regular');
      const standaloneMenu = makeMenu('menu-2', 'Special Cakes');

      locationMenuRepo.find.mockResolvedValue([
        makeLocationMenu('menu-1', mergedMenu),
        makeLocationMenu('menu-2', standaloneMenu),
      ]);

      // Both menus have no schedules (always active)
      menuScheduleRepo.find.mockResolvedValue([]);

      // Menu-1: merged, Menu-2: standalone
      menuConfigRepo.findOne
        .mockResolvedValueOnce({ mergeWithOthers: true, standalone: false })
        .mockResolvedValueOnce({ mergeWithOthers: false, standalone: true, prepTimeMinutes: 60, leadTimeHours: 2, requiresApproval: true, preorderEnabled: true });

      locationConfigRepo.findOne.mockResolvedValue(null);

      menuRepo.findOne
        .mockResolvedValueOnce({
          id: 'menu-1',
          menuProducts: [
            { productId: 'p1', sortOrder: 0, product: { id: 'p1', name: 'Bread', isActive: true, category: { name: 'Baked' } } },
          ],
        })
        .mockResolvedValueOnce({
          id: 'menu-2',
          menuProducts: [
            { productId: 'p2', sortOrder: 0, product: { id: 'p2', name: 'Custom Cake', isActive: true, category: { name: 'Cakes' } } },
          ],
        });

      optionGroupRepo.find.mockResolvedValue([]);

      const result = await service.getMenusForLocation('loc-1');

      expect(result.merged.products).toHaveLength(1);
      expect(result.merged.products[0].name).toBe('Bread');
      expect(result.standalone).toHaveLength(1);
      expect(result.standalone[0].menu.name).toBe('Special Cakes');
      expect(result.standalone[0].config.requiresApproval).toBe(true);
    });

    it('should handle specificDate schedules', async () => {
      const menu = makeMenu('menu-1', 'Holiday Special');
      locationMenuRepo.find.mockResolvedValue([makeLocationMenu('menu-1', menu)]);

      // Use today's date so it's not treated as future/preorder
      const today = new Date();
      const targetDate = today.toISOString().split('T')[0];

      menuScheduleRepo.find.mockResolvedValue([
        {
          specificDate: targetDate,
          startTime: '00:00',
          endTime: '23:59',
          isActive: true,
          dayOfWeek: null,
        },
      ]);

      menuConfigRepo.findOne.mockResolvedValue(null);
      locationConfigRepo.findOne.mockResolvedValue(null);
      menuRepo.findOne.mockResolvedValue({
        id: 'menu-1',
        menuProducts: [
          { productId: 'p1', sortOrder: 0, product: { id: 'p1', name: 'Easter Bread', isActive: true, category: null } },
        ],
      });
      optionGroupRepo.find.mockResolvedValue([]);

      const result = await service.getMenusForLocation('loc-1', targetDate, '12:00');

      expect(result.merged.products).toHaveLength(1);
      expect(result.merged.products[0].name).toBe('Easter Bread');
    });

    it('should include preorder menus for future dates when enabled', async () => {
      const menu = makeMenu('menu-1', 'Preorder');
      locationMenuRepo.find.mockResolvedValue([makeLocationMenu('menu-1', menu)]);

      // Future date
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      menuScheduleRepo.find.mockResolvedValue([]); // No schedule restrictions
      menuConfigRepo.findOne.mockResolvedValue({ preorderEnabled: true, mergeWithOthers: true, standalone: false });
      locationConfigRepo.findOne.mockResolvedValue({ preorderEnabled: true });

      menuRepo.findOne.mockResolvedValue({
        id: 'menu-1',
        menuProducts: [
          { productId: 'p1', sortOrder: 0, product: { id: 'p1', name: 'Preorder Cake', isActive: true, category: null } },
        ],
      });
      optionGroupRepo.find.mockResolvedValue([]);

      const result = await service.getMenusForLocation('loc-1', futureDateStr, '12:00');

      expect(result.merged.products).toHaveLength(1);
    });

    it('should skip future-date menus when preorder is not enabled', async () => {
      const menu = makeMenu('menu-1', 'Regular');
      locationMenuRepo.find.mockResolvedValue([makeLocationMenu('menu-1', menu)]);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      menuScheduleRepo.find.mockResolvedValue([]);
      menuConfigRepo.findOne.mockResolvedValue({ preorderEnabled: false, mergeWithOthers: true, standalone: false });
      locationConfigRepo.findOne.mockResolvedValue({ preorderEnabled: false });

      const result = await service.getMenusForLocation('loc-1', futureDateStr, '12:00');

      expect(result.merged.products).toHaveLength(0);
    });
  });

  describe('getAvailableDates', () => {
    it('should return dates with hasMenus flags based on schedules', async () => {
      locationConfigRepo.findOne.mockResolvedValue({ preorderDaysAhead: 3 });
      locationMenuRepo.find.mockResolvedValue([{ menuId: 'menu-1' }]);

      // Use today's day of week so we guarantee a match
      const todayDow = new Date().getDay();
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { dayOfWeek: todayDow, startTime: '08:00', endTime: '20:00', specificDate: null },
        ]),
      };
      menuScheduleRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getAvailableDates('loc-1');

      expect(result.length).toBeLessThanOrEqual(4); // 0..3 days
      // Today should have hasMenus=true since schedule matches today's day of week
      expect(result[0].hasMenus).toBe(true);
    });

    it('should return empty when no menus linked to location', async () => {
      locationConfigRepo.findOne.mockResolvedValue({ preorderDaysAhead: 7 });
      locationMenuRepo.find.mockResolvedValue([]);

      const result = await service.getAvailableDates('loc-1');

      expect(result).toEqual([]);
    });
  });
});
