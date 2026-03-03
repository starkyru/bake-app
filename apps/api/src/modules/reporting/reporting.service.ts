import { Injectable } from '@nestjs/common';
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
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { InventoryBatch } from '../inventory/entities/inventory-batch.entity';
import { ProductionPlan } from '../production/entities/production-plan.entity';
import { ProductionTask } from '../production/entities/production-task.entity';
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
    @InjectRepository(InventoryMovement) private movementRepo: Repository<InventoryMovement>,
    @InjectRepository(InventoryBatch) private batchRepo: Repository<InventoryBatch>,
    @InjectRepository(ProductionPlan) private planRepo: Repository<ProductionPlan>,
    @InjectRepository(ProductionTask) private taskRepo: Repository<ProductionTask>,
  ) {}

  // 1. Sales Summary - Revenue by day/week/month, order count, avg check
  async getSalesSummary(query: SalesReportQueryDto) {
    const groupBy = query.groupBy || 'day';
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .select(`DATE_TRUNC('${groupBy}', o.createdAt)`, 'period')
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

    let totalRevenue = 0;
    let totalExpenses = 0;
    for (const row of rows) {
      const amount = parseFloat(row.total) || 0;
      if (row.type === 'revenue') totalRevenue += amount;
      else if (row.type === 'expense') totalExpenses += Math.abs(amount);
    }
    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      breakdown: rows,
      totalRevenue,
      totalExpenses,
      netProfit,
      margin: Math.round(margin * 100) / 100,
    };
  }

  // 6. Inventory Status - Stock levels, low-stock alerts, expiring batches
  async getInventoryStatus(query: InventoryReportQueryDto) {
    const stockQb = this.inventoryItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.ingredient', 'ing')
      .leftJoin('item.location', 'loc')
      .select('item.id', 'id')
      .addSelect('ing.name', 'ingredientName')
      .addSelect('ing.unit', 'unit')
      .addSelect('ing.minStockLevel', 'minStockLevel')
      .addSelect('item.quantity', 'quantity')
      .addSelect('item.status', 'status')
      .addSelect('loc.name', 'locationName');
    if (query.locationId)
      stockQb.where('item.locationId = :locationId', { locationId: query.locationId });
    const stockLevels = await stockQb.getRawMany();

    const alertsQb = this.inventoryItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.ingredient', 'ing')
      .select('COUNT(item.id)', 'count')
      .addSelect('item.status', 'status')
      .groupBy('item.status');
    if (query.locationId)
      alertsQb.where('item.locationId = :locationId', { locationId: query.locationId });
    const statusSummary = await alertsQb.getRawMany();

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringQb = this.batchRepo
      .createQueryBuilder('b')
      .leftJoin('b.ingredient', 'ing')
      .select('b.id', 'id')
      .addSelect('ing.name', 'ingredientName')
      .addSelect('b.batchNumber', 'batchNumber')
      .addSelect('b.quantity', 'quantity')
      .addSelect('b.expiresAt', 'expiresAt')
      .where('b.expiresAt IS NOT NULL')
      .andWhere('b.expiresAt BETWEEN :now AND :weekFromNow', { now, weekFromNow })
      .andWhere('b.quantity > 0');
    if (query.locationId)
      expiringQb.andWhere('b.locationId = :locationId', { locationId: query.locationId });
    const expiringBatches = await expiringQb.getRawMany();

    return { stockLevels, statusSummary, expiringBatches };
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
