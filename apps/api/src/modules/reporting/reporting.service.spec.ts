import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportingService } from './reporting.service';
import { Order } from '../pos/entities/order.entity';
import { OrderItem } from '../pos/entities/order-item.entity';
import { Product } from '../pos/entities/product.entity';
import { Category } from '../pos/entities/category.entity';
import { Payment } from '../pos/entities/payment.entity';
import { FinanceTransaction } from '../finance/entities/finance-transaction.entity';
import { ExpenseRecord } from '../finance/entities/expense-record.entity';
import { Ingredient } from '../inventory/entities/ingredient.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { InventoryItemPackage } from '../inventory/entities/inventory-item-package.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { InventoryShipment } from '../inventory/entities/inventory-shipment.entity';
import { ProductionPlan } from '../production/entities/production-plan.entity';
import { ProductionTask } from '../production/entities/production-task.entity';

describe('ReportingService — BigNumber precision', () => {
  let service: ReportingService;
  let orderRepo: Record<string, jest.Mock>;
  let transactionRepo: Record<string, jest.Mock>;

  function makeQb(rawResult: any) {
    return {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(rawResult),
      getRawMany: jest.fn().mockResolvedValue(rawResult),
    };
  }

  function makeMockRepo(overrides: Record<string, jest.Mock> = {}) {
    return {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(makeQb([])),
      ...overrides,
    };
  }

  beforeEach(async () => {
    orderRepo = makeMockRepo();
    transactionRepo = makeMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: makeMockRepo() },
        { provide: getRepositoryToken(Product), useValue: makeMockRepo() },
        { provide: getRepositoryToken(Category), useValue: makeMockRepo() },
        { provide: getRepositoryToken(Payment), useValue: makeMockRepo() },
        { provide: getRepositoryToken(FinanceTransaction), useValue: transactionRepo },
        { provide: getRepositoryToken(ExpenseRecord), useValue: makeMockRepo() },
        { provide: getRepositoryToken(Ingredient), useValue: makeMockRepo() },
        { provide: getRepositoryToken(InventoryItem), useValue: makeMockRepo() },
        { provide: getRepositoryToken(InventoryItemPackage), useValue: makeMockRepo() },
        { provide: getRepositoryToken(InventoryMovement), useValue: makeMockRepo() },
        { provide: getRepositoryToken(InventoryShipment), useValue: makeMockRepo() },
        { provide: getRepositoryToken(ProductionPlan), useValue: makeMockRepo() },
        { provide: getRepositoryToken(ProductionTask), useValue: makeMockRepo() },
      ],
    }).compile();

    service = module.get<ReportingService>(ReportingService);
  });

  describe('getSalesToday — avgCheck precision', () => {
    it('should calculate avgCheck with 2 decimal places', async () => {
      const todayQb = makeQb({ revenue: '100', orderCount: '3' });
      const lastWeekQb = makeQb({ revenue: '80', orderCount: '2' });
      orderRepo.createQueryBuilder
        .mockReturnValueOnce(todayQb)
        .mockReturnValueOnce(lastWeekQb);

      const result = await service.getSalesToday();

      // 100 / 3 = 33.333... -> 33.33
      expect(result.avgCheck).toBe(33.33);
      expect(typeof result.avgCheck).toBe('number');
    });

    it('should return 0 avgCheck when no orders today', async () => {
      const todayQb = makeQb({ revenue: '0', orderCount: '0' });
      const lastWeekQb = makeQb({ revenue: '50', orderCount: '5' });
      orderRepo.createQueryBuilder
        .mockReturnValueOnce(todayQb)
        .mockReturnValueOnce(lastWeekQb);

      const result = await service.getSalesToday();

      expect(result.avgCheck).toBe(0);
      expect(result.totalOrders).toBe(0);
    });

    it('should calculate revenue trend percentage correctly', async () => {
      const todayQb = makeQb({ revenue: '150', orderCount: '10' });
      const lastWeekQb = makeQb({ revenue: '100', orderCount: '8' });
      orderRepo.createQueryBuilder
        .mockReturnValueOnce(todayQb)
        .mockReturnValueOnce(lastWeekQb);

      const result = await service.getSalesToday();

      // (150-100)/100 * 100 = 50%
      expect(result.revenueTrend).toBe(50);
      // (10-8)/8 * 100 = 25%
      expect(result.ordersTrend).toBe(25);
    });

    it('should handle trend with tricky float division', async () => {
      // 33.33 revenue today, 10 last week => (33.33-10)/10*100 = 233.3
      const todayQb = makeQb({ revenue: '33.33', orderCount: '1' });
      const lastWeekQb = makeQb({ revenue: '10', orderCount: '1' });
      orderRepo.createQueryBuilder
        .mockReturnValueOnce(todayQb)
        .mockReturnValueOnce(lastWeekQb);

      const result = await service.getSalesToday();

      expect(result.revenueTrend).toBe(233.3);
      expect(typeof result.revenueTrend).toBe('number');
    });

    it('should return 0 trends when previous values are 0', async () => {
      const todayQb = makeQb({ revenue: '50', orderCount: '5' });
      const lastWeekQb = makeQb({ revenue: '0', orderCount: '0' });
      orderRepo.createQueryBuilder
        .mockReturnValueOnce(todayQb)
        .mockReturnValueOnce(lastWeekQb);

      const result = await service.getSalesToday();

      expect(result.revenueTrend).toBe(0);
      expect(result.ordersTrend).toBe(0);
    });
  });

  describe('getFinanceSummary — P&L precision', () => {
    it('should calculate net profit and margin with precision', async () => {
      const rows = [
        { type: 'revenue', category: 'sales', total: '1000.50' },
        { type: 'expense', category: 'ingredients', total: '-300.20' },
        { type: 'expense', category: 'labor', total: '-200.10' },
      ];
      const qb = makeQb(rows);
      transactionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getFinanceSummary({});

      expect(result.totalRevenue).toBe(1000.50);
      expect(result.totalExpenses).toBe(500.30); // 300.20 + 200.10
      expect(result.netProfit).toBe(500.20); // 1000.50 - 500.30
      expect(typeof result.margin).toBe('number');
      // margin = (500.20 / 1000.50) * 100 = 49.9750...
      expect(result.margin).toBeCloseTo(49.98, 1);
    });

    it('should handle 0.1 + 0.2 in revenue accumulation', async () => {
      const rows = [
        { type: 'revenue', category: 'a', total: '0.1' },
        { type: 'revenue', category: 'b', total: '0.2' },
      ];
      const qb = makeQb(rows);
      transactionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getFinanceSummary({});

      // 0.1 + 0.2 must be exactly 0.3
      expect(result.totalRevenue).toBe(0.3);
      expect(result.netProfit).toBe(0.3);
    });

    it('should return 0 margin when no revenue', async () => {
      const rows = [
        { type: 'expense', category: 'rent', total: '-500' },
      ];
      const qb = makeQb(rows);
      transactionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getFinanceSummary({});

      expect(result.totalRevenue).toBe(0);
      expect(result.totalExpenses).toBe(500);
      expect(result.netProfit).toBe(-500);
      expect(result.margin).toBe(0);
    });

    it('should produce plain number outputs, not BigNumber instances', async () => {
      const rows = [
        { type: 'revenue', category: 'sales', total: '123.45' },
        { type: 'expense', category: 'cost', total: '-67.89' },
      ];
      const qb = makeQb(rows);
      transactionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getFinanceSummary({});

      expect(typeof result.totalRevenue).toBe('number');
      expect(typeof result.totalExpenses).toBe('number');
      expect(typeof result.netProfit).toBe('number');
      expect(typeof result.margin).toBe('number');
    });
  });
});
