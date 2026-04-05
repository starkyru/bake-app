import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductOptionService } from './product-option.service';
import { ProductOptionGroup } from '../entities/product-option-group.entity';
import { ProductOption } from '../entities/product-option.entity';

describe('ProductOptionService', () => {
  let service: ProductOptionService;
  let groupRepo: Record<string, jest.Mock>;
  let optionRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    groupRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((data) => ({ id: 'grp-new', ...data })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      remove: jest.fn(),
    };
    optionRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((data) => ({ id: 'opt-new', ...data })),
      save: jest.fn((entity) => Promise.resolve(entity)),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductOptionService,
        { provide: getRepositoryToken(ProductOptionGroup), useValue: groupRepo },
        { provide: getRepositoryToken(ProductOption), useValue: optionRepo },
      ],
    }).compile();

    service = module.get<ProductOptionService>(ProductOptionService);
  });

  describe('getGroups', () => {
    it('should return groups with options ordered by sortOrder', async () => {
      const groups = [
        { id: 'g1', name: 'Size', sortOrder: 0, options: [{ id: 'o1', sortOrder: 0 }] },
        { id: 'g2', name: 'Milk', sortOrder: 1, options: [{ id: 'o2', sortOrder: 0 }] },
      ];
      groupRepo.find.mockResolvedValue(groups);

      const result = await service.getGroups('prod-1');

      expect(groupRepo.find).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
        relations: ['options'],
        order: { sortOrder: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('createGroup', () => {
    it('should create group linked to product', async () => {
      const result = await service.createGroup('prod-1', {
        name: 'Size',
        type: 'single',
        isRequired: true,
        sortOrder: 0,
      });

      expect(groupRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 'prod-1', name: 'Size' }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('updateGroup', () => {
    it('should update existing group', async () => {
      groupRepo.findOne.mockResolvedValue({ id: 'g1', name: 'Old', sortOrder: 0 });

      const result = await service.updateGroup('g1', { name: 'New Name' });

      expect(result.name).toBe('New Name');
    });

    it('should throw NotFoundException for missing group', async () => {
      groupRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateGroup('g999', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteGroup', () => {
    it('should remove the group', async () => {
      const group = { id: 'g1', name: 'Size' };
      groupRepo.findOne.mockResolvedValue(group);

      await service.deleteGroup('g1');

      expect(groupRepo.remove).toHaveBeenCalledWith(group);
    });

    it('should throw NotFoundException for missing group', async () => {
      groupRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteGroup('g999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createOption', () => {
    it('should create option linked to group', async () => {
      groupRepo.findOne.mockResolvedValue({ id: 'g1', name: 'Size' });

      const result = await service.createOption('g1', {
        name: 'Large',
        priceModifier: 20,
        isDefault: false,
        sortOrder: 1,
      });

      expect(optionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ groupId: 'g1', name: 'Large', priceModifier: 20 }),
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if group does not exist', async () => {
      groupRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createOption('g999', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOption', () => {
    it('should update existing option', async () => {
      optionRepo.findOne.mockResolvedValue({ id: 'o1', name: 'Small', priceModifier: 0 });

      const result = await service.updateOption('o1', { priceModifier: 10 });

      expect(result.priceModifier).toBe(10);
    });

    it('should throw NotFoundException for missing option', async () => {
      optionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateOption('o999', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteOption', () => {
    it('should remove the option', async () => {
      const option = { id: 'o1', name: 'Small' };
      optionRepo.findOne.mockResolvedValue(option);

      await service.deleteOption('o1');

      expect(optionRepo.remove).toHaveBeenCalledWith(option);
    });

    it('should throw NotFoundException for missing option', async () => {
      optionRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteOption('o999')).rejects.toThrow(NotFoundException);
    });
  });
});
