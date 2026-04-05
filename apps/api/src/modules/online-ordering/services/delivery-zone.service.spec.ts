import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DeliveryZoneService } from './delivery-zone.service';
import { DeliveryZone } from '../entities/delivery-zone.entity';

describe('DeliveryZoneService', () => {
  let service: DeliveryZoneService;
  let zoneRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    zoneRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((data) => ({ id: 'zone-new', isActive: true, ...data })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryZoneService,
        { provide: getRepositoryToken(DeliveryZone), useValue: zoneRepo },
      ],
    }).compile();

    service = module.get<DeliveryZoneService>(DeliveryZoneService);
  });

  describe('findByLocation', () => {
    it('should return only active zones for a location', async () => {
      const zones = [
        { id: 'z1', name: 'Downtown', locationId: 'loc-1', isActive: true },
        { id: 'z2', name: 'Suburbs', locationId: 'loc-1', isActive: true },
      ];
      zoneRepo.find.mockResolvedValue(zones);

      const result = await service.findByLocation('loc-1');

      expect(zoneRepo.find).toHaveBeenCalledWith({
        where: { locationId: 'loc-1', isActive: true },
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('checkAddress', () => {
    it('should return matching zone for address within radius', async () => {
      // Zone centered at Kyiv (50.4501, 30.5234) with 5km radius
      zoneRepo.find.mockResolvedValue([
        {
          id: 'z1',
          name: 'Central',
          radiusKm: 5,
          polygon: { lat: 50.4501, lng: 30.5234 },
          deliveryFee: 50,
          isActive: true,
        },
      ]);

      // Address very close to center (~0.5km away)
      const result = await service.checkAddress('loc-1', 50.4510, 30.5240);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('z1');
    });

    it('should return fallback zone for address outside all specific zones', async () => {
      // Zone centered at Kyiv with 1km radius
      zoneRepo.find.mockResolvedValue([
        {
          id: 'z1',
          name: 'Central',
          radiusKm: 1,
          polygon: { lat: 50.4501, lng: 30.5234 },
          deliveryFee: 50,
          isActive: true,
        },
      ]);

      // Address far away (Lviv)
      const result = await service.checkAddress('loc-1', 49.8397, 24.0297);

      // Falls through to the fallback: returns zones[0] if zones.length > 0
      expect(result).not.toBeNull();
      expect(result!.id).toBe('z1');
    });

    it('should return null when no zones exist', async () => {
      zoneRepo.find.mockResolvedValue([]);

      const result = await service.checkAddress('loc-1', 50.0, 30.0);

      expect(result).toBeNull();
    });

    it('should work with polygon-based zones', async () => {
      // Triangle polygon around a test point
      zoneRepo.find.mockResolvedValue([
        {
          id: 'z1',
          name: 'Polygon Zone',
          radiusKm: null,
          polygon: [
            { lat: 50.0, lng: 30.0 },
            { lat: 51.0, lng: 30.0 },
            { lat: 50.5, lng: 31.0 },
          ],
          deliveryFee: 30,
          isActive: true,
        },
      ]);

      // Point inside the triangle
      const result = await service.checkAddress('loc-1', 50.4, 30.3);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('z1');
    });
  });

  describe('create', () => {
    it('should create a delivery zone for a location', async () => {
      const result = await service.create('loc-1', {
        name: 'New Zone',
        radiusKm: 3,
        deliveryFee: 40,
        minimumOrder: 100,
      });

      expect(zoneRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ locationId: 'loc-1', name: 'New Zone' }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update an existing zone', async () => {
      zoneRepo.findOne.mockResolvedValue({ id: 'z1', name: 'Old Name', deliveryFee: 30 });

      const result = await service.update('z1', { name: 'New Name', deliveryFee: 50 });

      expect(result.name).toBe('New Name');
    });

    it('should throw NotFoundException for non-existent zone', async () => {
      zoneRepo.findOne.mockResolvedValue(null);

      await expect(service.update('z999', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should soft-delete by setting isActive=false', async () => {
      zoneRepo.findOne.mockResolvedValue({ id: 'z1', isActive: true });

      await service.delete('z1');

      expect(zoneRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
    });

    it('should throw NotFoundException for non-existent zone', async () => {
      zoneRepo.findOne.mockResolvedValue(null);

      await expect(service.delete('z999')).rejects.toThrow(NotFoundException);
    });
  });
});
