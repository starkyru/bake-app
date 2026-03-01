import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('finance_transactions')
export class FinanceTransaction extends BaseEntity {
  @Column()
  type: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'reference_type', nullable: true })
  referenceType: string;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ name: 'location_id', nullable: true })
  locationId: string;
}
