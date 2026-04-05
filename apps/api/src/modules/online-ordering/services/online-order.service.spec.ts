import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OnlineOrderService } from './online-order.service';
import { Order } from '../../pos/entities/order.entity';
import { OrderItem } from '../../pos/entities/order-item.entity';
import { OrderItemOption } from '../entities/order-item-option.entity';
import { Product } from '../../pos/entities/product.entity';
import { ProductOptionGroup } from '../../pos/entities/product-option-group.entity';
import { ProductOption } from '../../pos/entities/product-option.entity';
import { LocationConfig } from '../entities/location-config.entity';
import { MenuConfig } from '../entities/menu-config.entity';
import { DeliveryZone } from '../entities/delivery-zone.entity';
import { CustomerAddress } from '../entities/customer-address.entity';
import { LocationMenu } from '../entities/location-menu.entity';

describe('OnlineOrderService', () => {
  let service: OnlineOrderService;
  let orderRepo: Record<string, jest.Mock>;
  let orderItemRepo: Record<string, jest.Mock>;
  let orderItemOptionRepo: Record<string, jest.Mock>;
  let productRepo: Record<string, jest.Mock>;
  let optionGroupRepo: Record<string, jest.Mock>;
  let optionRepo: Record<string, jest.Mock>;
  let locationConfigRepo: Record<string, jest.Mock>;
  let menuConfigRepo: Record<string, jest.Mock>;
  let deliveryZoneRepo: Record<string, jest.Mock>;
  let addressRepo: Record<string, jest.Mock>;
  let locationMenuRepo: Record<string, jest.Mock>;
  let eventEmitter: { emit: jest.Mock };

  const mockLocationConfig: Partial<LocationConfig> = {
    locationId: 'loc-1',
    enabledForOnlineOrdering: true,
    pickupEnabled: true,
    deliveryEnabled: true,
    shippingEnabled: false,
    dineInQrEnabled: false,
    taxRate: 0.12,
    preorderEnabled: false,
    preorderDaysAhead: 7,
  };

  beforeEach(async () => {
    orderRepo = {
      create: jest.fn((data) => ({ id: 'order-1', ...data })),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: entity.id || 'order-1' })),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    orderItemRepo = {
      create: jest.fn((data) => ({ id: 'item-1', ...data })),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: entity.id || 'item-1' })),
    };
    orderItemOptionRepo = {
      create: jest.fn((data) => data),
      save: jest.fn((entity) => Promise.resolve(entity)),
    };
    productRepo = { findOne: jest.fn() };
    optionGroupRepo = { find: jest.fn() };
    optionRepo = { findOne: jest.fn() };
    locationConfigRepo = { findOne: jest.fn() };
    menuConfigRepo = { createQueryBuilder: jest.fn() };
    deliveryZoneRepo = { find: jest.fn() };
    addressRepo = { findOne: jest.fn() };
    locationMenuRepo = { find: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnlineOrderService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemRepo },
        { provide: getRepositoryToken(OrderItemOption), useValue: orderItemOptionRepo },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(ProductOptionGroup), useValue: optionGroupRepo },
        { provide: getRepositoryToken(ProductOption), useValue: optionRepo },
        { provide: getRepositoryToken(LocationConfig), useValue: locationConfigRepo },
        { provide: getRepositoryToken(MenuConfig), useValue: menuConfigRepo },
        { provide: getRepositoryToken(DeliveryZone), useValue: deliveryZoneRepo },
        { provide: getRepositoryToken(CustomerAddress), useValue: addressRepo },
        { provide: getRepositoryToken(LocationMenu), useValue: locationMenuRepo },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<OnlineOrderService>(OnlineOrderService);
  });

  function setupBasicCreateOrder() {
    locationConfigRepo.findOne.mockResolvedValue(mockLocationConfig);
    locationMenuRepo.find.mockResolvedValue([{ menuId: 'menu-1' }]);

    productRepo.findOne.mockResolvedValue({
      id: 'prod-1',
      name: 'Croissant',
      price: 50,
      isActive: true,
      optionGroups: [],
    });

    const menuConfigQb = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    menuConfigRepo.createQueryBuilder.mockReturnValue(menuConfigQb);

    // findOne for the final order fetch
    orderRepo.findOne.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ONL-TEST',
      status: 'pending',
      items: [],
    });
  }

  describe('createOrder', () => {
    it('should create order with correct subtotal calculation', async () => {
      setupBasicCreateOrder();

      const result = await service.createOrder('cust-1', {
        locationId: 'loc-1',
        fulfillmentType: 'pickup',
        items: [
          { productId: 'prod-1', quantity: 3 },
        ],
      });

      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 150, // 50 * 3
          source: 'online',
        }),
      );
      expect(result).toBeDefined();
    });

    it('should include option price modifiers in unit price', async () => {
      locationConfigRepo.findOne.mockResolvedValue(mockLocationConfig);
      locationMenuRepo.find.mockResolvedValue([{ menuId: 'menu-1' }]);

      productRepo.findOne.mockResolvedValue({
        id: 'prod-1',
        name: 'Latte',
        price: 80,
        isActive: true,
        optionGroups: [
          {
            id: 'grp-1',
            name: 'Size',
            isRequired: false,
            maxSelections: null,
            options: [
              { id: 'opt-1', name: 'Large', priceModifier: 20, isActive: true },
            ],
          },
        ],
      });

      const menuConfigQb = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      menuConfigRepo.createQueryBuilder.mockReturnValue(menuConfigQb);
      orderRepo.findOne.mockResolvedValue({ id: 'order-1', items: [] });

      await service.createOrder('cust-1', {
        locationId: 'loc-1',
        fulfillmentType: 'pickup',
        items: [
          {
            productId: 'prod-1',
            quantity: 2,
            options: [{ optionGroupId: 'grp-1', optionId: 'opt-1' }],
          },
        ],
      });

      // unitPrice = 80 + 20 = 100, subtotal = 100 * 2 = 200
      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ subtotal: 200 }),
      );
    });

    it('should apply tax from location config', async () => {
      locationConfigRepo.findOne.mockResolvedValue({ ...mockLocationConfig, taxRate: 0.1 });
      locationMenuRepo.find.mockResolvedValue([{ menuId: 'menu-1' }]);
      productRepo.findOne.mockResolvedValue({
        id: 'prod-1',
        name: 'Bread',
        price: 100,
        isActive: true,
        optionGroups: [],
      });
      const menuConfigQb = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      menuConfigRepo.createQueryBuilder.mockReturnValue(menuConfigQb);
      orderRepo.findOne.mockResolvedValue({ id: 'order-1', items: [] });

      await service.createOrder('cust-1', {
        locationId: 'loc-1',
        fulfillmentType: 'pickup',
        items: [{ productId: 'prod-1', quantity: 1 }],
      });

      // subtotal=100, tax=100*0.1=10, total=100+10=110
      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tax: 10, total: 110 }),
      );
    });

    it('should set status to pending_approval when menu requires approval', async () => {
      locationConfigRepo.findOne.mockResolvedValue(mockLocationConfig);
      locationMenuRepo.find.mockResolvedValue([{ menuId: 'menu-1' }]);
      productRepo.findOne.mockResolvedValue({
        id: 'prod-1',
        name: 'Custom Cake',
        price: 500,
        isActive: true,
        optionGroups: [],
      });
      const menuConfigQb = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ requiresApproval: true }]),
      };
      menuConfigRepo.createQueryBuilder.mockReturnValue(menuConfigQb);
      orderRepo.findOne.mockResolvedValue({ id: 'order-1', items: [] });

      await service.createOrder('cust-1', {
        locationId: 'loc-1',
        fulfillmentType: 'pickup',
        items: [{ productId: 'prod-1', quantity: 1 }],
      });

      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending_approval',
          requiresApproval: true,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'onlineOrder.approvalNeeded',
        expect.any(Object),
      );
    });

    it('should set status to pending when no approval needed', async () => {
      setupBasicCreateOrder();

      await service.createOrder('cust-1', {
        locationId: 'loc-1',
        fulfillmentType: 'pickup',
        items: [{ productId: 'prod-1', quantity: 1 }],
      });

      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' }),
      );
    });

    it('should validate fulfillment type is enabled for location', async () => {
      locationConfigRepo.findOne.mockResolvedValue({
        ...mockLocationConfig,
        shippingEnabled: false,
      });

      await expect(
        service.createOrder('cust-1', {
          locationId: 'loc-1',
          fulfillmentType: 'shipping',
          items: [{ productId: 'prod-1', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if location not enabled for online ordering', async () => {
      locationConfigRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createOrder('cust-1', {
          locationId: 'loc-1',
          fulfillmentType: 'pickup',
          items: [{ productId: 'prod-1', quantity: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create OrderItemOptions with denormalized names', async () => {
      locationConfigRepo.findOne.mockResolvedValue(mockLocationConfig);
      locationMenuRepo.find.mockResolvedValue([{ menuId: 'menu-1' }]);
      productRepo.findOne.mockResolvedValue({
        id: 'prod-1',
        name: 'Coffee',
        price: 60,
        isActive: true,
        optionGroups: [
          {
            id: 'grp-1',
            name: 'Milk',
            isRequired: false,
            maxSelections: null,
            options: [
              { id: 'opt-1', name: 'Oat Milk', priceModifier: 15, isActive: true },
            ],
          },
        ],
      });
      const menuConfigQb = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      menuConfigRepo.createQueryBuilder.mockReturnValue(menuConfigQb);
      orderRepo.findOne.mockResolvedValue({ id: 'order-1', items: [] });

      await service.createOrder('cust-1', {
        locationId: 'loc-1',
        fulfillmentType: 'pickup',
        items: [
          {
            productId: 'prod-1',
            quantity: 1,
            options: [{ optionGroupId: 'grp-1', optionId: 'opt-1' }],
          },
        ],
      });

      expect(orderItemOptionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          optionGroupName: 'Milk',
          optionName: 'Oat Milk',
          priceModifier: 15,
        }),
      );
    });

    it('should add delivery fee for delivery orders', async () => {
      locationConfigRepo.findOne.mockResolvedValue(mockLocationConfig);
      locationMenuRepo.find.mockResolvedValue([{ menuId: 'menu-1' }]);
      productRepo.findOne.mockResolvedValue({
        id: 'prod-1',
        name: 'Bread',
        price: 100,
        isActive: true,
        optionGroups: [],
      });
      addressRepo.findOne.mockResolvedValue({ id: 'addr-1', customerId: 'cust-1' });
      deliveryZoneRepo.find.mockResolvedValue([
        { id: 'zone-1', deliveryFee: 50, minimumOrder: 0, isActive: true },
      ]);
      const menuConfigQb = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      menuConfigRepo.createQueryBuilder.mockReturnValue(menuConfigQb);
      orderRepo.findOne.mockResolvedValue({ id: 'order-1', items: [] });

      await service.createOrder('cust-1', {
        locationId: 'loc-1',
        fulfillmentType: 'delivery',
        deliveryAddressId: 'addr-1',
        items: [{ productId: 'prod-1', quantity: 1 }],
      });

      // subtotal=100, deliveryFee=50, taxableAmount=150, tax=150*0.12=18, total=150+18=168
      expect(orderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          discount: 50, // deliveryFee stored in discount field
          total: 168,
        }),
      );
    });

    it('should generate ONL- prefixed order number', async () => {
      setupBasicCreateOrder();

      await service.createOrder('cust-1', {
        locationId: 'loc-1',
        fulfillmentType: 'pickup',
        items: [{ productId: 'prod-1', quantity: 1 }],
      });

      const createdOrder = orderRepo.create.mock.calls[0][0];
      expect(createdOrder.orderNumber).toMatch(/^ONL-/);
    });
  });

  describe('cancelOrder', () => {
    it('should succeed for pending orders', async () => {
      orderRepo.findOne
        .mockResolvedValueOnce({
          id: 'order-1',
          customerId: 'cust-1',
          status: 'pending',
          orderNumber: 'ONL-123',
        });
      orderRepo.save.mockImplementation((o) => Promise.resolve(o));

      const result = await service.cancelOrder('order-1', 'cust-1');

      expect(result.status).toBe('cancelled');
    });

    it('should fail for in_progress orders', async () => {
      orderRepo.findOne.mockResolvedValue({
        id: 'order-1',
        customerId: 'cust-1',
        status: 'in_progress',
      });

      await expect(
        service.cancelOrder('order-1', 'cust-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fail if customer does not own the order', async () => {
      orderRepo.findOne.mockResolvedValue({
        id: 'order-1',
        customerId: 'cust-other',
        status: 'pending',
      });

      await expect(
        service.cancelOrder('order-1', 'cust-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent order', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.cancelOrder('order-999', 'cust-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveOrder', () => {
    it('should change status from pending_approval to confirmed', async () => {
      orderRepo.findOne.mockResolvedValue({
        id: 'order-1',
        status: 'pending_approval',
        orderNumber: 'ONL-123',
      });
      orderRepo.save.mockImplementation((o) => Promise.resolve(o));

      const result = await service.approveOrder('order-1', 'staff-1');

      expect(result.status).toBe('confirmed');
      expect(result.approvedBy).toBe('staff-1');
      expect(result.approvedAt).toBeInstanceOf(Date);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'onlineOrder.approved',
        expect.objectContaining({ orderId: 'order-1' }),
      );
    });

    it('should reject if order is not pending_approval', async () => {
      orderRepo.findOne.mockResolvedValue({
        id: 'order-1',
        status: 'confirmed',
      });

      await expect(
        service.approveOrder('order-1', 'staff-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectOrder', () => {
    it('should change status to cancelled', async () => {
      orderRepo.findOne.mockResolvedValue({
        id: 'order-1',
        status: 'pending_approval',
        orderNumber: 'ONL-123',
      });
      orderRepo.save.mockImplementation((o) => Promise.resolve(o));

      const result = await service.rejectOrder('order-1', 'staff-1', 'Out of stock');

      expect(result.status).toBe('cancelled');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'onlineOrder.statusChanged',
        expect.objectContaining({ reason: 'Out of stock' }),
      );
    });

    it('should reject if order is in a non-rejectable status', async () => {
      orderRepo.findOne.mockResolvedValue({
        id: 'order-1',
        status: 'completed',
      });

      await expect(
        service.rejectOrder('order-1', 'staff-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
