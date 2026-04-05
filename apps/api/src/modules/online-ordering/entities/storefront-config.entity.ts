import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Location } from '../../inventory/entities/location.entity';

@Entity('storefront_configs')
export class StorefrontConfig extends BaseEntity {
  @OneToOne(() => Location, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ name: 'location_id', nullable: true })
  locationId: string;

  @Column({ name: 'theme_preset', default: 'warm' })
  themePreset: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @Column({ name: 'hero_image_url', nullable: true })
  heroImageUrl: string;

  @Column({ name: 'business_name', nullable: true })
  businessName: string;

  @Column({ nullable: true })
  tagline: string;

  @Column({ name: 'primary_color', nullable: true })
  primaryColor: string;

  @Column({ name: 'accent_color', nullable: true })
  accentColor: string;

  @Column({ name: 'custom_domain', nullable: true, unique: true })
  customDomain: string;
}
