import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { StorageCondition } from './storage-condition.entity';

@Entity('locations')
export class Location extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: 'retail' })
  type: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => StorageCondition, sc => sc.location)
  storageConditions: StorageCondition[];
}
