import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  CreateIngredientDto, UpdateIngredientDto, CreateLocationDto, UpdateLocationDto,
  CreateInventoryItemDto, UpdateInventoryItemDto, AddShipmentDto, AddPackageDto,
  WriteOffDto, TransferDto, CreateIngredientCategoryDto, UpdateIngredientCategoryDto,
} from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Inventory')
@Controller('api/v1')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('ingredients')
  @RequirePermissions('ingredients:read')
  @ApiOperation({ summary: 'Get all ingredients' })
  findAllIngredients(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.inventoryService.findAllIngredients(
      { page: Number(page) || 1, limit: Number(limit) || 20, search } as PaginationDto,
      category,
    );
  }

  @Post('ingredients')
  @RequirePermissions('ingredients:create')
  @ApiOperation({ summary: 'Create ingredient' })
  createIngredient(@Body() dto: CreateIngredientDto) {
    return this.inventoryService.createIngredient(dto);
  }

  @Put('ingredients/:id')
  @RequirePermissions('ingredients:update')
  @ApiOperation({ summary: 'Update ingredient' })
  updateIngredient(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.inventoryService.updateIngredient(id, dto);
  }

  @Delete('ingredients/:id')
  @RequirePermissions('ingredients:delete')
  @ApiOperation({ summary: 'Delete ingredient' })
  deleteIngredient(@Param('id') id: string) {
    return this.inventoryService.deleteIngredient(id);
  }

  // Ingredient Categories
  @Get('ingredient-categories')
  @RequirePermissions('ingredients:read')
  @ApiOperation({ summary: 'Get all ingredient categories' })
  findAllIngredientCategories() {
    return this.inventoryService.findAllIngredientCategories();
  }

  @Post('ingredient-categories')
  @RequirePermissions('ingredients:create')
  @ApiOperation({ summary: 'Create ingredient category' })
  createIngredientCategory(@Body() dto: CreateIngredientCategoryDto) {
    return this.inventoryService.createIngredientCategory(dto);
  }

  @Put('ingredient-categories/:id')
  @RequirePermissions('ingredients:update')
  @ApiOperation({ summary: 'Update ingredient category' })
  updateIngredientCategory(@Param('id') id: string, @Body() dto: UpdateIngredientCategoryDto) {
    return this.inventoryService.updateIngredientCategory(id, dto);
  }

  @Delete('ingredient-categories/:id')
  @RequirePermissions('ingredients:delete')
  @ApiOperation({ summary: 'Delete ingredient category' })
  deleteIngredientCategory(@Param('id') id: string) {
    return this.inventoryService.deleteIngredientCategory(id);
  }

  @Get('locations')
  @RequirePermissions('locations:read')
  @ApiOperation({ summary: 'Get all locations' })
  findAllLocations() {
    return this.inventoryService.findAllLocations();
  }

  @Post('locations')
  @RequirePermissions('locations:create')
  @ApiOperation({ summary: 'Create location' })
  createLocation(@Body() dto: CreateLocationDto) {
    return this.inventoryService.createLocation(dto);
  }

  @Put('locations/:id')
  @RequirePermissions('locations:update')
  @ApiOperation({ summary: 'Update location' })
  updateLocation(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.inventoryService.updateLocation(id, dto);
  }

  @Delete('locations/:id')
  @RequirePermissions('locations:delete')
  @ApiOperation({ summary: 'Delete location' })
  deleteLocation(@Param('id') id: string) {
    return this.inventoryService.deleteLocation(id);
  }

  @Get('inventory')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Get stock levels' })
  getStockLevels() {
    return this.inventoryService.getStockLevels();
  }

  @Get('inventory/:id')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Get single inventory item with package stock' })
  getInventoryItem(@Param('id') id: string) {
    return this.inventoryService.getInventoryItem(id);
  }

  @Post('inventory')
  @RequirePermissions('inventory:create')
  @ApiOperation({ summary: 'Create inventory item with packages' })
  createInventoryItem(@Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.createInventoryItem(dto);
  }

  @Put('inventory/:id')
  @RequirePermissions('inventory:update')
  @ApiOperation({ summary: 'Update inventory item' })
  updateInventoryItem(@Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.updateInventoryItem(id, dto);
  }

  @Delete('inventory/:id')
  @RequirePermissions('inventory:delete')
  @ApiOperation({ summary: 'Delete inventory item' })
  deleteInventoryItem(@Param('id') id: string) {
    return this.inventoryService.deleteInventoryItem(id);
  }

  @Post('inventory/:id/packages')
  @RequirePermissions('inventory:create')
  @ApiOperation({ summary: 'Add package to inventory item' })
  addPackage(@Param('id') id: string, @Body() dto: AddPackageDto) {
    return this.inventoryService.addPackage(id, dto);
  }

  @Delete('inventory/:id/packages/:packageId')
  @RequirePermissions('inventory:delete')
  @ApiOperation({ summary: 'Remove package from inventory item' })
  removePackage(@Param('id') id: string, @Param('packageId') packageId: string) {
    return this.inventoryService.removePackage(id, packageId);
  }

  @Post('inventory/:id/shipments')
  @RequirePermissions('inventory:create')
  @ApiOperation({ summary: 'Add shipment to inventory item' })
  addShipment(@Param('id') id: string, @Body() dto: AddShipmentDto, @Request() req: any) {
    return this.inventoryService.addShipment(id, dto, req.user?.id);
  }

  @Get('inventory/:id/shipments')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Get shipments for inventory item' })
  getShipments(@Param('id') id: string) {
    return this.inventoryService.getShipments(id);
  }

  @Post('inventory/write-off')
  @RequirePermissions('inventory:create')
  @ApiOperation({ summary: 'Process write-off' })
  processWriteOff(@Body() dto: WriteOffDto, @Request() req: any) {
    return this.inventoryService.processWriteOff(dto, req.user?.id);
  }

  @Post('inventory/transfer')
  @RequirePermissions('inventory:create')
  @ApiOperation({ summary: 'Process transfer' })
  processTransfer(@Body() dto: TransferDto, @Request() req: any) {
    return this.inventoryService.processTransfer(dto, req.user?.id);
  }
}
