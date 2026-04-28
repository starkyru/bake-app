import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductionBatch } from './entities/production-batch.entity';
import { DOMAIN_EVENTS } from '../websocket/ws-events.constants';

@Injectable()
export class ExpiryCheckService {
  constructor(
    @InjectRepository(ProductionBatch) private batchRepo: Repository<ProductionBatch>,
    private eventEmitter: EventEmitter2,
  ) {}

  @Cron('0 * * * *') // every hour
  async checkExpiringBatches(): Promise<void> {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Mark expired batches
    const expired = await this.batchRepo.find({
      where: {
        status: In(['available', 'partially_consumed']),
        expiryDate: LessThanOrEqual(now),
      },
    });

    for (const batch of expired) {
      batch.status = 'expired';
      await this.batchRepo.save(batch);
      this.eventEmitter.emit(DOMAIN_EVENTS.BATCH_EXPIRED, {
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        recipeName: batch.recipeName,
        locationId: batch.locationId,
      });
    }

    // Warn about expiring soon
    const expiringSoon = await this.batchRepo
      .createQueryBuilder('b')
      .where('b.status IN (:...statuses)', { statuses: ['available', 'partially_consumed'] })
      .andWhere('b.expiryDate > :now', { now: now.toISOString() })
      .andWhere('b.expiryDate <= :threshold', { threshold: in24h.toISOString() })
      .getMany();

    if (expiringSoon.length > 0) {
      this.eventEmitter.emit(DOMAIN_EVENTS.BATCH_EXPIRING_SOON, {
        batches: expiringSoon.map(b => ({
          batchId: b.id,
          batchNumber: b.batchNumber,
          recipeName: b.recipeName,
          expiryDate: b.expiryDate,
          remainingQuantity: b.remainingQuantity,
          unit: b.unit,
          locationId: b.locationId,
        })),
      });
    }
  }
}
