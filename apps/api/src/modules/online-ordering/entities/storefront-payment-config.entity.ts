import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Location } from '../../inventory/entities/location.entity';

@Entity('storefront_payment_configs')
@Unique(['locationId', 'provider'])
export class StorefrontPaymentConfig extends BaseEntity {
  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ name: 'location_id', nullable: true })
  locationId: string;

  @Column()
  provider: string;

  @Column({ name: 'public_key' })
  publicKey: string;

  @Column({ name: 'secret_key_encrypted' })
  secretKeyEncrypted: string;

  @Column({ name: 'webhook_secret', nullable: true })
  webhookSecret: string;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @Column({ name: 'is_sandbox', default: true })
  isSandbox: boolean;
}
