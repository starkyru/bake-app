import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column()
  type: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: 'medium' })
  priority: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'reference_type', nullable: true })
  referenceType: string;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: string;

  @Column({ name: 'user_id' })
  userId: string;
}
