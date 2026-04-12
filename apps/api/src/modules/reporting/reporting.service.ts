import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { convertToBaseUnit, getMetricEquivalent } from '../inventory/unit-conversion';
import { ProductionPlan } from '../production/entities/production-plan.entity';
import { ProductionTask } from '../production/entities/production-task.entity';
import BigNumber from 'bignumber.js';
import {
  SalesReportQueryDto,
  DateRangeQueryDto,
  InventoryReportQueryDto,
  ProductionReportQueryDto,
} from './dto';

@Injectable()
export class ReportingService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(FinanceTransaction) private transactionRepo: Repository<FinanceTransaction>,
    @InjectRepository(ExpenseRecord) private expenseRepo: Repository<ExpenseRecord>,
    @InjectRepository(Ingredient) private ingredientRepo: Repository<Ingredient>,
    @InjectRepository(InventoryItem) private inventoryItemRepo: Repository<InventoryItem>,
    @InjectRepository(InventoryItemPackage) private packageRepo: Repository<InventoryItemPackage>,
    @InjectRepository(InventoryMovement) private movementRepo: Repository<InventoryMovement>,
    @InjectRepository(InventoryShipment) private shipmentRepo: Repository<InventoryShipment>,
    @InjectRepository(ProductionPlan) private planRepo: Repository<ProductionPlan>,
    @InjectRepository(ProductionTask) private taskRepo: Repository<ProductionTask>,
  ) {}

  // 0. Sales Today — snapshot with week-over-week trend
  async getSalesToday() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const lastWeekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekEnd = new Date(todayEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const todayData = await this.orderRepo
      .createQueryBuilder('o')
      .select('COUNT(o.id)', 'orderCount')
      .addSelect('COALESCE(SUM(o.total), 0)', 'revenue')
      .where('o.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('o.createdAt >= :start AND o.createdAt < :end', {
        start: todayStart,
        end: todayEnd,
      })
      .getRawOne();

    const lastWeekData = await this.orderRepo
      .createQueryBuilder('o')
      .select('COUNT(o.id)', 'orderCount')
      .addSelect('COALESCE(SUM(o.total), 0)', 'revenue')
      .where('o.status != :cancelled', { cancelled: 'cancelled' })
      .andWhere('o.createdAt >= :start AND o.createdAt < :end', {
        start: lastWeekStart,
        end: lastWeekEnd,
      })
      .getRawOne();

    const totalRevenue = parseFloat(todayData.revenue) || 0;
    const totalOrders = parseInt(todayData.orderCount, 10) || 0;
    const avgCheck = totalOrders > 0
      ? new BigNumber(totalRevenue).div(totalOrders).decimalPlaces(2, BigNumber.ROUND_HALF_UP).toNumber()
      : 0;

    const prevRevenue = parseFloat(lastWeekData.revenue) || 0;
    const prevOrders = parseInt(lastWeekData.orderCount, 10) || 0;

    const revenueTrend = prevRevenue > 0
      ? new BigNumber(totalRevenue).minus(prevRevenue).div(prevRevenue).times(100).decimalPlaces(2, BigNumber.ROUND_HALF_UP).toNumber()
      : 0;
    const ordersTrend = prevOrders > 0
      ? new BigNumber(totalOrders).minus(prevOrders).div(prevOrders).times(100).decimalPlaces(2, BigNumber.ROUND_HALF_UP).toNumber()
      : 0;

    return { totalRevenue, totalOrders, avgCheck, revenueTrend, ordersTrend };
  }

  // 1. Sales Summary - Revenue by day/week/month, order count, avg check
  async getSalesSummary(query: SalesReportQueryDto) {
    const allowedGroupBy: Record<string, string> = {
      day: 'day',
      week: 'week',
      month: 'month',
    };
    const groupByValue = allowedGroupBy[query.groupBy || 'day'];
    if (!groupByValue) {
      throw new BadRequestException(
        `Invalid groupBy value. Allowed: ${Object.keys(allowedGroupBy).join(', ')}`,
      );
    }
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .select(`DATE_TRUNC('${groupByValue}', o.createdAt)`, 'period')
      .addSelect('COUNT(o.id)', 'orderCount')
      .addSelect('SUM(o.total)', 'revenue')
      .addSelect('AVG(o.total)', 'avgCheck')
      .where('o.status != :cancelled', { cancelled: 'cancelled' });
    if (query.startDate && query.endDate) {
      qb.andWhere('o.createdAt BETWEEN :start AND :end', {
        start: query.startDate,
        end: query.endDate,
      });
    }
    if (query.locationId)
      qb.andWhere('o.locationId = :locationId', { locationId: query.locationId });
    qb.groupBy('period').orderBy('period', 'ASC');
    return qb.getRawMany();
  }

  // 2. Top Products - Top 20 products by revenue with category
  async getTopProducts(query: DateRangeQueryDto) {
    const qb = this.orderItemRepo
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .innerJoin('oi.product', 'p')
      .leftJoin('p.category', 'c')
      .select('p.id', 'productId')
      .addSelect('p.name', 'productName')
      .addSelect('c.name', 'categoryName')
      .addSelect('SUM(oi.quantity)', 'totalQuantity')
      .addSelect('SUM(oi.subtotal)', 'totalRevenue')
      .where('o.status != :cancelled', { cancelled: 'cancelled' });
    if (query.startDate && query.endDate) {
      qb.andWhere('o.createdAt BETWEEN :start AND :end', {
        start: query.startDate,
        end: query.endDate,
      });
    }
    if (query.locationId)
      qb.andWhere('o.locationId = :locationId', { locationId: query.locationId });
    qb.groupBy('p.id')
      .addGroupBy('p.name')
      .addGroupBy('c.name')
      .orderBy('"totalRevenue"', 'DESC')
      .limit(20);
    return qb.getRawMany();
  }

  // 3. Sales by Category
  async getSalesByCategory(query: DateRangeQueryDto) {
    const qb = this.orderItemRepo
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .innerJoin('oi.product', 'p')
      .leftJoin('p.category', 'c')
      .select('c.id', 'categoryId')
      .addSelect('c.name', 'categoryName')
      .addSelect('SUM(oi.quantity)', 'totalQuantity')
      .addSelect('SUM(oi.subtotal)', 'totalRevenue')
      .where('o.status != :cancelled', { cancelled: 'cancelled' });
    if (query.startDate && query.endDate) {
      qb.andWhere('o.createdAt BETWEEN :start AND :end', {
        start: query.startDate,
        end: query.endDate,
      });
    }
    if (query.locationId)
      qb.andWhere('o.locationId = :locationId', { locationId: query.locationId });
    qb.groupBy('c.id').addGroupBy('c.name').orderBy('"totalRevenue"', 'DESC');
    return qb.getRawMany();
  }

  // 4. Payment Methods - Cash vs card distribution
  async getPaymentMethods(query: DateRangeQueryDto) {
    const qb = this.paymentRepo
      .createQueryBuilder('pay')
      .innerJoin('pay.order', 'o')
      .select('pay.method', 'method')
      .addSelect('COUNT(pay.id)', 'count')
      .addSelect('SUM(pay.amount)', 'total')
      .where('pay.status = :completed', { completed: 'completed' });
    if (query.startDate && query.endDate) {
      qb.andWhere('o.createdAt BETWEEN :start AND :end', {
        start: query.startDate,
        end: query.endDate,
      });
    }
    if (query.locationId)
      qb.andWhere('o.locationId = :locationId', { locationId: query.locationId });
    qb.groupBy('pay.method');
    return qb.getRawMany();
  }

  // 5. Finance Summary - P&L: revenue vs expenses, net profit, margin
  async getFinanceSummary(query: DateRangeQueryDto) {
    const qb = this.transactionRepo
      .createQueryBuilder('t')
      .select('t.type', 'type')
      .addSelect('t.category', 'category')
      .addSelect('SUM(t.amount)', 'total');
    if (query.startDate && query.endDate) {
      qb.where('t.createdAt BETWEEN :start AND :end', {
        start: query.startDate,
        end: query.endDate,
      });
    }
    if (query.locationId)
      qb.andWhere('t.locationId = :locationId', { locationId: query.locationId });
    qb.groupBy('t.type').addGroupBy('t.category');
    const rows = await qb.getRawMany();

    let totalRevenueBN = new BigNumber(0);
    let totalExpensesBN = new BigNumber(0);
    for (const row of rows) {
      const amount = new BigNumber(row.total || 0);
      if (row.type === 'revenue') totalRevenueBN = totalRevenueBN.plus(amount);
      else if (row.type === 'expense') totalExpensesBN = totalExpensesBN.plus(amount.abs());
    }
    const netProfit = totalRevenueBN.minus(totalExpensesBN);
    const margin = totalRevenueBN.gt(0)
      ? netProfit.div(totalRevenueBN).times(100).decimalPlaces(2, BigNumber.ROUND_HALF_UP).toNumber()
      : 0;

    return {
      breakdown: rows,
      totalRevenue: totalRevenueBN.toNumber(),
      totalExpenses: totalExpensesBN.toNumber(),
      netProfit: netProfit.toNumber(),
      margin,
    };
  }

  // 6. Inventory Status - Stock levels computed via shipments with unit conversions
  async getInventoryStatus(query: InventoryReportQueryDto) {
    const items = await this.inventoryItemRepo.find({
      relations: ['ingredient', 'packages', 'shipments'],
    });

    const stockLevels = items.map((item) => {
      const ingredientUnit = item.ingredient?.unit || 'g';
      let totalQuantity = 0;

      const packageMap = new Map<string, InventoryItemPackage>();
      for (const pkg of (item.packages || [])) {
        packageMap.set(pkg.id, pkg);
      }

      // Filter by locationId if provided
      const shipments = query.locationId
        ? (item.shipments || []).filter((s) => s.locationId === query.locationId)
        : (item.shipments || []);

      for (const shipment of shipments) {
        const pkg = packageMap.get(shipment.packageId);
        if (!pkg) continue;
        const converted = convertToBaseUnit(Number(pkg.size), pkg.unit, ingredientUnit);
        totalQuantity += Number(shipment.packageCount) * converted;
      }

      const qty = Math.round(totalQuantity * 100) / 100;
      const minLevel = Number(item.minStockLevel || 0);
      let status = 'in_stock';
      if (qty <= 0) {
        status = 'out_of_stock';
      } else if (minLevel > 0 && qty <= minLevel) {
        status = 'low_stock';
      }

      const metricEquiv = getMetricEquivalent(qty, ingredientUnit);

      return {
        id: item.id,
        title: item.title,
        ingredientName: item.ingredient?.name,
        unit: ingredientUnit,
        minStockLevel: minLevel,
        calories: item.ingredient?.calories,
        quantity: qty,
        status,
        metricQuantity: metricEquiv?.value,
        metricUnit: metricEquiv?.unit,
      };
    });

    const statusSummary = [
      { status: 'in_stock', count: stockLevels.filter((i) => i.status === 'in_stock').length },
      { status: 'low_stock', count: stockLevels.filter((i) => i.status === 'low_stock').length },
      { status: 'out_of_stock', count: stockLevels.filter((i) => i.status === 'out_of_stock').length },
    ];

    const lowStockItems = stockLevels.filter((item) => item.status !== 'in_stock');

    return { stockLevels, statusSummary, expiringBatches: [], lowStockItems };
  }

  // 7. Inventory Movements - Movement summary by type, ingredient usage, waste
  async getInventoryMovements(query: InventoryReportQueryDto) {
    const summaryQb = this.movementRepo
      .createQueryBuilder('m')
      .select('m.type', 'type')
      .addSelect('COUNT(m.id)', 'count')
      .addSelect('SUM(m.quantity)', 'totalQuantity')
      .addSelect('SUM(m.quantity * COALESCE(m.unitCost, 0))', 'totalCost');
    if (query.startDate && query.endDate) {
      summaryQb.where('m.createdAt BETWEEN :start AND :end', {
        start: query.startDate,
        end: query.endDate,
      });
    }
    summaryQb.groupBy('m.type');
    const byType = await summaryQb.getRawMany();

    const usageQb = this.movementRepo
      .createQueryBuilder('m')
      .leftJoin('m.ingredient', 'ing')
      .select('ing.id', 'ingredientId')
      .addSelect('ing.name', 'ingredientName')
      .addSelect('m.type', 'type')
      .addSelect('SUM(m.quantity)', 'totalQuantity');
    if (query.startDate && query.endDate) {
      usageQb.where('m.createdAt BETWEEN :start AND :end', {
        start: query.startDate,
        end: query.endDate,
      });
    }
    usageQb
      .groupBy('ing.id')
      .addGroupBy('ing.name')
      .addGroupBy('m.type')
      .orderBy('"totalQuantity"', 'DESC');
    const byIngredient = await usageQb.getRawMany();

    return { byType, byIngredient };
  }

  // 8. Production Summary - Plan execution by status, yield/waste rates
  async getProductionSummary(query: ProductionReportQueryDto) {
    const planQb = this.planRepo
      .createQueryBuilder('p')
      .select('p.status', 'status')
      .addSelect('COUNT(p.id)', 'count');
    if (query.startDate && query.endDate) {
      planQb.where('p.date BETWEEN :start AND :end', {
        start: query.startDate,
        end: query.endDate,
      });
    }
    if (query.locationId)
      planQb.andWhere('p.locationId = :locationId', { locationId: query.locationId });
    planQb.groupBy('p.status');
    const plansByStatus = await planQb.getRawMany();

    const taskQb = this.taskRepo
      .createQueryBuilder('t')
      .innerJoin('t.plan', 'p')
      .select('t.recipeName', 'recipeName')
      .addSelect('t.recipeId', 'recipeId')
      .addSelect('COUNT(t.id)', 'taskCount')
      .addSelect('SUM(t.plannedQuantity)', 'totalPlanned')
      .addSelect('SUM(COALESCE(t.actualYield, 0))', 'totalYield')
      .addSelect('SUM(t.wasteQuantity)', 'totalWaste');
    if (query.startDate && query.endDate) {
      taskQb.where('p.date BETWEEN :start AND :end', {
        start: query.startDate,
        end: query.endDate,
      });
    }
    if (query.locationId)
      taskQb.andWhere('p.locationId = :locationId', { locationId: query.locationId });
    taskQb.groupBy('t.recipeName').addGroupBy('t.recipeId');
    const byRecipe = await taskQb.getRawMany();

    return { plansByStatus, byRecipe };
  }
}
