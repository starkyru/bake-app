import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FinanceTransaction } from './entities/finance-transaction.entity';
import { ExpenseRecord } from './entities/expense-record.entity';
import { CreateExpenseDto } from './dto';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FinanceTransaction) private transactionRepo: Repository<FinanceTransaction>,
    @InjectRepository(ExpenseRecord) private expenseRepo: Repository<ExpenseRecord>,
  ) {}

  async getTransactions(startDate?: string, endDate?: string, locationId?: string) {
    const qb = this.transactionRepo.createQueryBuilder('t');
    if (startDate && endDate) qb.where('t.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate });
    if (locationId) qb.andWhere('t.locationId = :locationId', { locationId });
    qb.orderBy('t.createdAt', 'DESC');
    return qb.getMany();
  }

  async getSummary(startDate: string, endDate: string, locationId?: string) {
    const qb = this.transactionRepo.createQueryBuilder('t')
      .select('t.type', 'type')
      .addSelect('SUM(t.amount)', 'total')
      .where('t.createdAt BETWEEN :start AND :end', { start: startDate, end: endDate })
      .groupBy('t.type');
    if (locationId) qb.andWhere('t.locationId = :locationId', { locationId });
    return qb.getRawMany();
  }

  async createExpense(dto: CreateExpenseDto): Promise<ExpenseRecord> {
    const expense = this.expenseRepo.create({ ...dto, date: new Date(dto.date) });
    const saved = await this.expenseRepo.save(expense);
    await this.transactionRepo.save(this.transactionRepo.create({
      type: 'expense',
      amount: -dto.amount,
      category: dto.category,
      description: dto.description,
      referenceType: 'expense',
      referenceId: saved.id,
      locationId: dto.locationId,
    }));
    return saved;
  }

  async getExpenses(startDate?: string, endDate?: string): Promise<ExpenseRecord[]> {
    const qb = this.expenseRepo.createQueryBuilder('e');
    if (startDate && endDate) qb.where('e.date BETWEEN :start AND :end', { start: startDate, end: endDate });
    qb.orderBy('e.date', 'DESC');
    return qb.getMany();
  }
}
