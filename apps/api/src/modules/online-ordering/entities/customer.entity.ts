import { Entity, Column, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CustomerAddress } from './customer-address.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ nullable: true, unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Exclude()
  @Column({ name: 'password_hash', nullable: true, select: false })
  passwordHash: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ name: 'auth_provider', default: 'local' })
  authProvider: string;

  @Exclude()
  @Column({ name: 'social_id', nullable: true, select: false })
  socialId: string;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'is_phone_verified', default: false })
  isPhoneVerified: boolean;

  @Column({ name: 'notification_prefs', type: 'jsonb', default: '{"email":true,"sms":false,"push":false}' })
  notificationPrefs: { email: boolean; sms: boolean; push: boolean };

  @Column({ name: 'dietary_preferences', type: 'jsonb', nullable: true })
  dietaryPreferences: string[];

  @Column({ type: 'jsonb', nullable: true })
  allergies: string[];

  @Column({ name: 'is_guest', default: false })
  isGuest: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => CustomerAddress, (address) => address.customer, { cascade: true })
  addresses: CustomerAddress[];
}
