import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PosService } from './pos.service';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Menu } from './entities/menu.entity';
import { MenuProduct } from './entities/menu-product.entity';

describe('PosService', () => {
  let service: PosService;
  let productRepo: Record<string, jest.Mock>;
  let orderRepo: Record<string, jest.Mock>;
  let orderItemRepo: Record<string, jest.Mock>;
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    productRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      create: jest.fn((d) => d),
      save: jest.fn((e) => Promise.resolve(e)),
      createQueryBuilder: jest.fn(),
    };
    orderRepo = {
      create: jest.fn((d) => ({ id: 'order-1', ...d })),
      save: jest.fn((e) => Promise.resolve({ ...e, id: e.id || 'order-1' })),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
    };
    orderItemRepo = {
      create: jest.fn((d) => d),
      save: jest.fn((e) => Promise.resolve(e)),
    };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: getRepositoryToken(Category), useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn((d) => d), save: jest.fn((e) => Promise.resolve(e)) } },
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemRepo },
        { provide: getRepositoryToken(Payment), useValue: { create: jest.fn((d) => d), save: jest.fn((e) => Promise.resolve(e)) } },
        { provide: getRepositoryToken(Menu), useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn((d) => d), save: jest.fn((e) => Promise.resolve(e)), createQueryBuilder: jest.fn() } },
        { provide: getRepositoryToken(MenuProduct), useValue: { findOne: jest.fn(), create: jest.fn((d) => d), save: jest.fn((e) => Promise.resolve(e)), remove: jest.fn() } },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
  });

  describe('createOrder — BigNumber precision', () => {
    function mockProduct(price: number) {
      productRepo.findOne.mockResolvedValue({
        id: 'prod-1',
        name: 'Test Product',
        price,
      });
    }

    it('should handle 0.1 + 0.2 precision correctly (classic float trap)', async () => {
      // Two items: price 0.1 * 1 + price 0.2 * 1 should equal 0.3 exactly
      productRepo.findOne
        .mockResolvedValueOnce({ id: 'p1', name: 'A', price: 0.1 })
        .mockResolvedValueOnce({ id: 'p2', name: 'B', price: 0.2 });

      await service.createOrder({
        items: [
          { productId: 'p1', quantity: 1 },
          { productId: 'p2', quantity: 1 },
        ],
      } as any);

      const created = orderRepo.create.mock.calls[0][0];
      // subtotal should be exactly 0.3, not 0.30000000000000004
      expect(created.subtotal).toBe(0.3);
    });

    it('should calculate 19.99 * 3 without floating-point error', async () => {
      mockProduct(19.99);

      await service.createOrder({
        items: [{ productId: 'prod-1', quantity: 3 }],
      } as any);

      const created = orderRepo.create.mock.calls[0][0];
      // 19.99 * 3 = 59.97 exactly (native JS gives 59.97 here, but let's confirm)
      expect(created.subtotal).toBe(59.97);
    });

    it('should calculate tax with 12% rate on 33.33 correctly', async () => {
      mockProduct(33.33);

      await service.createOrder({
        items: [{ productId: 'prod-1', quantity: 1 }],
      } as any);

      const created = orderRepo.create.mock.calls[0][0];
      // subtotal = 33.33, tax = 33.33 * 0.12 = 3.9996 -> rounded to 4.00
      expect(created.subtotal).toBe(33.33);
      expect(created.tax).toBe(4);
    });

    it('should handle many items accumulating small prices', async () => {
      // 10 items at $0.1 each = $1.00 exactly
      productRepo.findOne.mockResolvedValue({ id: 'p1', name: 'Tiny', price: 0.1 });

      const items = Array.from({ length: 10 }, () => ({
        productId: 'p1',
        quantity: 1,
      }));

      await service.createOrder({ items } as any);

      const created = orderRepo.create.mock.calls[0][0];
      expect(created.subtotal).toBe(1);
    });

    it('should apply discount correctly with BigNumber', async () => {
      mockProduct(100);

      await service.createOrder({
        items: [{ productId: 'prod-1', quantity: 1 }],
        discount: 10.1,
      } as any);

      const created = orderRepo.create.mock.calls[0][0];
      // subtotal = 100, discount = 10.1, taxable = 89.9
      // tax = 89.9 * 0.12 = 10.788 -> 10.79
      // total = 89.9 + 10.79 = 100.69
      expect(created.subtotal).toBe(100);
      expect(created.discount).toBe(10.1);
      expect(created.tax).toBe(10.79);
      expect(created.total).toBe(100.69);
    });

    it('should produce number types, not BigNumber instances', async () => {
      mockProduct(25);

      await service.createOrder({
        items: [{ productId: 'prod-1', quantity: 2 }],
      } as any);

      const created = orderRepo.create.mock.calls[0][0];
      expect(typeof created.subtotal).toBe('number');
      expect(typeof created.tax).toBe('number');
      expect(typeof created.total).toBe('number');
      expect(typeof created.discount).toBe('number');
    });

    it('should calculate unitPrice and itemSubtotal for each item', async () => {
      mockProduct(7.77);

      await service.createOrder({
        items: [{ productId: 'prod-1', quantity: 3 }],
      } as any);

      const created = orderRepo.create.mock.calls[0][0];
      const item = created.items[0];
      expect(item.unitPrice).toBe(7.77);
      expect(item.subtotal).toBe(23.31); // 7.77 * 3
    });

    it('should throw NotFoundException for unknown product', async () => {
      productRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createOrder({
          items: [{ productId: 'bad-id', quantity: 1 }],
        } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle $0.01 * 100 exactly (penny precision)', async () => {
      mockProduct(0.01);

      await service.createOrder({
        items: [{ productId: 'prod-1', quantity: 100 }],
      } as any);

      const created = orderRepo.create.mock.calls[0][0];
      expect(created.subtotal).toBe(1);
    });

    it('should correctly compute tax on a large order', async () => {
      // A problematic case: 9999.99 * 0.12
      mockProduct(9999.99);

      await service.createOrder({
        items: [{ productId: 'prod-1', quantity: 1 }],
      } as any);

      const created = orderRepo.create.mock.calls[0][0];
      // 9999.99 * 0.12 = 1199.9988 -> rounded to 1200.00
      expect(created.tax).toBe(1200);
      expect(created.total).toBe(11199.99);
    });
  });
});
