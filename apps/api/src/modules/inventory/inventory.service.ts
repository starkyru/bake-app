import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Ingredient } from './entities/ingredient.entity';
import { IngredientCategory } from './entities/ingredient-category.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryItemPackage } from './entities/inventory-item-package.entity';
import { InventoryShipment } from './entities/inventory-shipment.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { Location } from './entities/location.entity';
import {
  CreateIngredientDto, UpdateIngredientDto, CreateLocationDto, UpdateLocationDto,
  CreateInventoryItemDto, UpdateInventoryItemDto, AddShipmentDto, AddPackageDto,
  WriteOffDto, TransferDto, CreateIngredientCategoryDto, UpdateIngredientCategoryDto,
} from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { DOMAIN_EVENTS } from '../websocket/ws-events.constants';
import { convertToBaseUnit, getMetricEquivalent, CONVERSION_FACTORS } from './unit-conversion';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Ingredient) private ingredientRepo: Repository<Ingredient>,
    @InjectRepository(IngredientCategory) private ingredientCategoryRepo: Repository<IngredientCategory>,
    @InjectRepository(InventoryItem) private inventoryItemRepo: Repository<InventoryItem>,
    @InjectRepository(InventoryItemPackage) private packageRepo: Repository<InventoryItemPackage>,
    @InjectRepository(InventoryShipment) private shipmentRepo: Repository<InventoryShipment>,
    @InjectRepository(InventoryMovement) private movementRepo: Repository<InventoryMovement>,
    @InjectRepository(Location) private locationRepo: Repository<Location>,
    private eventEmitter: EventEmitter2,
  ) {}

  // Ingredients
  async findAllIngredients(query: PaginationDto, category?: string): Promise<PaginatedResponseDto<Ingredient>> {
    const { page, limit, search } = query;
    const qb = this.ingredientRepo.createQueryBuilder('i');
    if (search) qb.where('i.name ILIKE :search', { search: `%${search}%` });
    if (category) qb.andWhere('i.category = :category', { category });
    qb.orderBy('i.name', 'ASC');
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async createIngredient(dto: CreateIngredientDto): Promise<Ingredient> {
    return this.ingredientRepo.save(this.ingredientRepo.create(dto));
  }

  async updateIngredient(id: string, dto: UpdateIngredientDto): Promise<Ingredient> {
    const ingredient = await this.ingredientRepo.findOne({ where: { id } });
    if (!ingredient) throw new NotFoundException('Ingredient not found');
    Object.assign(ingredient, dto);
    return this.ingredientRepo.save(ingredient);
  }

  async deleteIngredient(id: string): Promise<void> {
    const ingredient = await this.ingredientRepo.findOne({ where: { id } });
    if (!ingredient) throw new NotFoundException('Ingredient not found');
    await this.ingredientRepo.remove(ingredient);
  }

  // Locations
  async findAllLocations(): Promise<Location[]> {
    return this.locationRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async createLocation(dto: CreateLocationDto): Promise<Location> {
    return this.locationRepo.save(this.locationRepo.create(dto));
  }

  async updateLocation(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.locationRepo.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    Object.assign(location, dto);
    return this.locationRepo.save(location);
  }

  async deleteLocation(id: string): Promise<void> {
    const location = await this.locationRepo.findOne({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    const shipmentCount = await this.shipmentRepo.count({ where: { locationId: id } });
    if (shipmentCount > 0) {
      throw new BadRequestException('Cannot delete location with inventory shipments');
    }
    await this.locationRepo.remove(location);
  }

  // Inventory Items
  async createInventoryItem(dto: CreateInventoryItemDto): Promise<InventoryItem> {
    const item = this.inventoryItemRepo.create({
      title: dto.title,
      ingredientId: dto.ingredientId,
    });
    const saved = await this.inventoryItemRepo.save(item);

    if (dto.packages?.length) {
      const packages = dto.packages.map((pkg, idx) =>
        this.packageRepo.create({
          inventoryItemId: saved.id,
          size: pkg.size,
          unit: pkg.unit,
          sortOrder: idx,
        }),
      );
      await this.packageRepo.save(packages);
    }

    return this.inventoryItemRepo.findOne({
      where: { id: saved.id },
      relations: ['ingredient', 'packages'],
    });
  }

  async updateInventoryItem(id: string, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const item = await this.inventoryItemRepo.findOne({
      where: { id },
      relations: ['ingredient', 'packages'],
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    // Update scalar fields
    if (dto.title !== undefined) item.title = dto.title;
    if (dto.minStockLevel !== undefined) item.minStockLevel = dto.minStockLevel;
    if (dto.minStockUnit !== undefined) item.minStockUnit = dto.minStockUnit;

    await this.inventoryItemRepo.save(item);

    // Sync packages if provided
    if (dto.packages) {
      const existingPkgs = item.packages || [];

      // Remove packages that are no longer in the list (only if they have no shipments)
      for (const existing of existingPkgs) {
        const stillPresent = dto.packages.some(
          (p) => p.size === existing.size && p.unit === existing.unit,
        );
        if (!stillPresent) {
          const shipmentCount = await this.shipmentRepo.count({
            where: { packageId: existing.id },
          });
          if (shipmentCount === 0) {
            await this.packageRepo.remove(existing);
          }
        }
      }

      // Add new packages
      for (let idx = 0; idx < dto.packages.length; idx++) {
        const p = dto.packages[idx];
        const exists = existingPkgs.some(
          (e) => e.size === p.size && e.unit === p.unit,
        );
        if (!exists) {
          await this.packageRepo.save(this.packageRepo.create({
            inventoryItemId: id,
            size: p.size,
            unit: p.unit,
            sortOrder: idx,
          }));
        }
      }
    }

    return this.inventoryItemRepo.findOne({
      where: { id },
      relations: ['ingredient', 'packages'],
    });
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const item = await this.inventoryItemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Inventory item not found');
    await this.inventoryItemRepo.remove(item);
  }

  async addPackage(inventoryItemId: string, dto: AddPackageDto): Promise<InventoryItemPackage> {
    const item = await this.inventoryItemRepo.findOne({ where: { id: inventoryItemId } });
    if (!item) throw new NotFoundException('Inventory item not found');

    const maxSort = await this.packageRepo
      .createQueryBuilder('p')
      .select('MAX(p.sort_order)', 'max')
      .where('p.inventory_item_id = :id', { id: inventoryItemId })
      .getRawOne();

    return this.packageRepo.save(this.packageRepo.create({
      inventoryItemId,
      size: dto.size,
      unit: dto.unit,
      sortOrder: (parseInt(maxSort?.max, 10) || 0) + 1,
    }));
  }

  async removePackage(inventoryItemId: string, packageId: string): Promise<void> {
    const pkg = await this.packageRepo.findOne({
      where: { id: packageId, inventoryItemId },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    const shipmentCount = await this.shipmentRepo.count({ where: { packageId } });
    if (shipmentCount > 0) {
      throw new BadRequestException('Cannot remove package that has shipments');
    }

    await this.packageRepo.remove(pkg);
  }

  async addShipment(inventoryItemId: string, dto: AddShipmentDto, userId?: string): Promise<InventoryShipment> {
    const item = await this.inventoryItemRepo.findOne({
      where: { id: inventoryItemId },
      relations: ['ingredient'],
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    const pkg = await this.packageRepo.findOne({
      where: { id: dto.packageId, inventoryItemId },
    });
    if (!pkg) throw new NotFoundException('Package not found for this inventory item');

    const shipment = await this.shipmentRepo.save(this.shipmentRepo.create({
      inventoryItemId,
      packageId: dto.packageId,
      packageCount: dto.packageCount,
      locationId: dto.locationId,
      batchNumber: dto.batchNumber,
      unitCost: dto.unitCost,
      notes: dto.notes,
      userId,
    }));

    // Create movement record
    const totalQuantity = Number(dto.packageCount) * convertToBaseUnit(
      Number(pkg.size), pkg.unit, item.ingredient?.unit || 'g',
    );
    await this.movementRepo.save(this.movementRepo.create({
      type: dto.packageCount >= 0 ? 'delivery' : 'write_off',
      quantity: Math.abs(totalQuantity),
      unitCost: dto.unitCost,
      notes: dto.notes,
      ingredientId: item.ingredientId,
      toLocationId: dto.packageCount >= 0 ? dto.locationId : undefined,
      fromLocationId: dto.packageCount < 0 ? dto.locationId : undefined,
      userId,
    }));

    if (dto.packageCount > 0) {
      this.eventEmitter.emit(DOMAIN_EVENTS.INVENTORY_DELIVERY, {
        movementType: 'delivery',
        ingredientId: item.ingredientId,
        ingredientName: item.ingredient?.name,
        quantity: totalQuantity,
        locationId: dto.locationId,
      });
    }

    await this.checkLowStock(item);

    return shipment;
  }

  async getShipments(inventoryItemId: string): Promise<InventoryShipment[]> {
    return this.shipmentRepo.find({
      where: { inventoryItemId },
      relations: ['package', 'location'],
      order: { createdAt: 'DESC' },
    });
  }

  async getInventoryItem(id: string): Promise<any> {
    const item = await this.inventoryItemRepo.findOne({
      where: { id },
      relations: ['ingredient', 'ingredient.ingredientCategory', 'packages', 'shipments', 'shipments.package', 'shipments.location'],
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    const ingredientUnit = item.ingredient?.unit || 'g';

    // Compute per-package stock
    const packageStockMap = new Map<string, number>();
    for (const pkg of (item.packages || [])) {
      packageStockMap.set(pkg.id, 0);
    }
    for (const shipment of (item.shipments || [])) {
      const current = packageStockMap.get(shipment.packageId) || 0;
      packageStockMap.set(shipment.packageId, current + Number(shipment.packageCount));
    }

    const packageStock = (item.packages || []).map((pkg) => ({
      id: pkg.id,
      size: pkg.size,
      unit: pkg.unit,
      sortOrder: pkg.sortOrder,
      remaining: packageStockMap.get(pkg.id) || 0,
    }));

    return {
      ...item,
      packageStock,
    };
  }

  // Stock levels — quantity & status computed from shipments with unit conversions
  async getStockLevels(): Promise<any[]> {
    const items = await this.inventoryItemRepo.find({
      relations: ['ingredient', 'ingredient.ingredientCategory', 'packages', 'shipments'],
    });

    return items.map((item) => {
      const ingredientUnit = item.ingredient?.unit || 'g';
      let totalQuantity = 0;

      // Build package map for quick lookup
      const packageMap = new Map<string, InventoryItemPackage>();
      for (const pkg of (item.packages || [])) {
        packageMap.set(pkg.id, pkg);
      }

      // Sum shipments with conversion
      for (const shipment of (item.shipments || [])) {
        const pkg = packageMap.get(shipment.packageId);
        if (!pkg) continue;
        const converted = convertToBaseUnit(Number(pkg.size), pkg.unit, ingredientUnit);
        totalQuantity += Number(shipment.packageCount) * converted;
      }

      // Use item-level minStockLevel, fall back to ingredient's
      let minStockLevel = 0;
      if (item.minStockLevel != null) {
        // Convert from minStockUnit to ingredient base unit if needed
        const minUnit = item.minStockUnit || ingredientUnit;
        minStockLevel = convertToBaseUnit(Number(item.minStockLevel), minUnit, ingredientUnit);
      } else {
        minStockLevel = Number(item.ingredient?.minStockLevel || 0);
      }

      let status = 'in_stock';
      if (totalQuantity <= 0) {
        status = 'out_of_stock';
      } else if (minStockLevel > 0 && totalQuantity <= minStockLevel) {
        status = 'low_stock';
      }

      // Metric equivalent
      const metricEquiv = getMetricEquivalent(totalQuantity, ingredientUnit);

      return {
        ...item,
        quantity: Math.round(totalQuantity * 100) / 100,
        status,
        metricQuantity: metricEquiv?.value,
        metricUnit: metricEquiv?.unit,
      };
    });
  }

  // Write-off — creates a negative shipment
  async processWriteOff(dto: WriteOffDto, userId?: string): Promise<InventoryShipment> {
    const item = await this.inventoryItemRepo.findOne({
      where: { id: dto.inventoryItemId },
      relations: ['ingredient'],
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    const pkg = await this.packageRepo.findOne({
      where: { id: dto.packageId, inventoryItemId: dto.inventoryItemId },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    const shipment = await this.addShipment(dto.inventoryItemId, {
      packageId: dto.packageId,
      packageCount: -dto.packageCount,
      locationId: dto.locationId,
      notes: dto.reason,
    }, userId);

    const totalQuantity = dto.packageCount * convertToBaseUnit(
      Number(pkg.size), pkg.unit, item.ingredient?.unit || 'g',
    );

    this.eventEmitter.emit(DOMAIN_EVENTS.INVENTORY_WRITE_OFF, {
      movementType: 'write_off',
      ingredientId: item.ingredientId,
      ingredientName: item.ingredient?.name,
      quantity: totalQuantity,
      locationId: dto.locationId,
    });

    return shipment;
  }

  // Transfer — negative shipment on source location, positive on destination
  async processTransfer(dto: TransferDto, userId?: string): Promise<void> {
    const fromItem = await this.inventoryItemRepo.findOne({
      where: { id: dto.fromInventoryItemId },
      relations: ['ingredient'],
    });
    if (!fromItem) throw new NotFoundException('Source inventory item not found');

    const pkg = await this.packageRepo.findOne({
      where: { id: dto.packageId, inventoryItemId: dto.fromInventoryItemId },
    });
    if (!pkg) throw new NotFoundException('Package not found');

    // Create negative shipment at source location
    await this.addShipment(dto.fromInventoryItemId, {
      packageId: dto.packageId,
      packageCount: -dto.packageCount,
      locationId: dto.fromLocationId,
      notes: dto.notes || 'Transfer out',
    }, userId);

    // Create positive shipment at destination location
    await this.addShipment(dto.fromInventoryItemId, {
      packageId: dto.packageId,
      packageCount: dto.packageCount,
      locationId: dto.toLocationId,
      notes: dto.notes || 'Transfer in',
    }, userId);

    // Create transfer movement record
    const totalQuantity = dto.packageCount * convertToBaseUnit(
      Number(pkg.size), pkg.unit, fromItem.ingredient?.unit || 'g',
    );

    await this.movementRepo.save(this.movementRepo.create({
      type: 'transfer',
      quantity: totalQuantity,
      notes: dto.notes,
      ingredientId: fromItem.ingredientId,
      fromLocationId: dto.fromLocationId,
      toLocationId: dto.toLocationId,
      userId,
    }));

    this.eventEmitter.emit(DOMAIN_EVENTS.INVENTORY_TRANSFER, {
      movementType: 'transfer',
      ingredientId: fromItem.ingredientId,
      ingredientName: fromItem.ingredient?.name,
      quantity: totalQuantity,
      fromLocationId: dto.fromLocationId,
      toLocationId: dto.toLocationId,
    });
  }

  // Ingredient Categories
  async findAllIngredientCategories(): Promise<IngredientCategory[]> {
    return this.ingredientCategoryRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async createIngredientCategory(dto: CreateIngredientCategoryDto): Promise<IngredientCategory> {
    return this.ingredientCategoryRepo.save(this.ingredientCategoryRepo.create(dto));
  }

  async updateIngredientCategory(id: string, dto: UpdateIngredientCategoryDto): Promise<IngredientCategory> {
    const cat = await this.ingredientCategoryRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Ingredient category not found');
    Object.assign(cat, dto);
    return this.ingredientCategoryRepo.save(cat);
  }

  async deleteIngredientCategory(id: string): Promise<void> {
    const cat = await this.ingredientCategoryRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException('Ingredient category not found');

    const ingredientCount = await this.ingredientRepo.count({
      where: { categoryId: id, isActive: true },
    });
    if (ingredientCount > 0) {
      throw new ConflictException(
        `Cannot delete category "${cat.name}": it has ${ingredientCount} ingredient(s)`,
      );
    }

    cat.isActive = false;
    await this.ingredientCategoryRepo.save(cat);
  }

  private async checkLowStock(item: InventoryItem): Promise<void> {
    const ingredient = item.ingredient || await this.ingredientRepo.findOne({ where: { id: item.ingredientId } });
    if (!ingredient) return;

    // Reload item to get minStockLevel fields if not present
    const fullItem = item.minStockLevel !== undefined ? item :
      await this.inventoryItemRepo.findOne({ where: { id: item.id } });

    const shipments = await this.shipmentRepo.find({
      where: { inventoryItemId: item.id },
      relations: ['package'],
    });

    let totalQuantity = 0;
    for (const shipment of shipments) {
      if (!shipment.package) continue;
      const converted = convertToBaseUnit(
        Number(shipment.package.size), shipment.package.unit, ingredient.unit,
      );
      totalQuantity += Number(shipment.packageCount) * converted;
    }

    // Use item-level minStockLevel, fall back to ingredient's
    let minStockLevel = 0;
    if (fullItem?.minStockLevel != null) {
      const minUnit = fullItem.minStockUnit || ingredient.unit;
      minStockLevel = convertToBaseUnit(Number(fullItem.minStockLevel), minUnit, ingredient.unit);
    } else {
      minStockLevel = Number(ingredient.minStockLevel);
    }

    if (minStockLevel > 0 && totalQuantity <= minStockLevel) {
      const status = totalQuantity <= 0 ? 'out_of_stock' : 'low_stock';
      this.eventEmitter.emit(DOMAIN_EVENTS.INVENTORY_LOW_STOCK, {
        ingredientId: item.ingredientId,
        ingredientName: ingredient.name,
        currentQuantity: totalQuantity,
        minStockLevel,
        status,
      });
    }
  }
}
