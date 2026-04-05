import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryZone } from '../entities/delivery-zone.entity';
import { CreateDeliveryZoneDto, UpdateDeliveryZoneDto } from '../dto';

@Injectable()
export class DeliveryZoneService {
  constructor(
    @InjectRepository(DeliveryZone) private zoneRepo: Repository<DeliveryZone>,
  ) {}

  async findByLocation(locationId: string): Promise<DeliveryZone[]> {
    return this.zoneRepo.find({
      where: { locationId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async create(locationId: string, dto: CreateDeliveryZoneDto): Promise<DeliveryZone> {
    return this.zoneRepo.save(
      this.zoneRepo.create({ ...dto, locationId }),
    );
  }

  async update(zoneId: string, dto: UpdateDeliveryZoneDto): Promise<DeliveryZone> {
    const zone = await this.zoneRepo.findOne({ where: { id: zoneId } });
    if (!zone) throw new NotFoundException('Delivery zone not found');
    Object.assign(zone, dto);
    return this.zoneRepo.save(zone);
  }

  async delete(zoneId: string): Promise<void> {
    const zone = await this.zoneRepo.findOne({ where: { id: zoneId } });
    if (!zone) throw new NotFoundException('Delivery zone not found');
    zone.isActive = false;
    await this.zoneRepo.save(zone);
  }

  async checkAddress(
    locationId: string,
    lat: number,
    lng: number,
  ): Promise<DeliveryZone | null> {
    const zones = await this.findByLocation(locationId);

    for (const zone of zones) {
      if (zone.radiusKm && zone.polygon) {
        const center = zone.polygon;
        if (center.lat !== undefined && center.lng !== undefined) {
          const distance = this.haversineDistance(lat, lng, center.lat, center.lng);
          if (distance <= Number(zone.radiusKm)) {
            return zone;
          }
        }
      }

      if (zone.radiusKm && !zone.polygon) {
        continue;
      }

      if (Array.isArray(zone.polygon) && zone.polygon.length >= 3) {
        if (this.pointInPolygon(lat, lng, zone.polygon)) {
          return zone;
        }
      }
    }

    if (zones.length > 0) {
      return zones[0];
    }

    return null;
  }

  private haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private pointInPolygon(
    lat: number,
    lng: number,
    polygon: { lat: number; lng: number }[],
  ): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat;
      const yi = polygon[i].lng;
      const xj = polygon[j].lat;
      const yj = polygon[j].lng;
      const intersect =
        yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }
}
