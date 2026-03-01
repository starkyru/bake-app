import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('expense_records')
export class ExpenseRecord extends BaseEntity {
  @Column()
  category: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'location_id', nullable: true })
  locationId: string;
}
