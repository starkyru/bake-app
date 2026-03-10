import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateIngredientDto, UpdateIngredientDto, CreateLocationDto, UpdateLocationDto, DeliveryDto, WriteOffDto, TransferDto, CreateIngredientCategoryDto, UpdateIngredientCategoryDto } from './dto';
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
  findAllIngredients(@Query() query: PaginationDto, @Query('category') category?: string) {
    return this.inventoryService.findAllIngredients(query, category);
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
  getStockLevels(@Query('locationId') locationId?: string) {
    return this.inventoryService.getStockLevels(locationId);
  }

  @Post('inventory/delivery')
  @RequirePermissions('inventory:create')
  @ApiOperation({ summary: 'Process delivery' })
  processDelivery(@Body() dto: DeliveryDto, @Request() req: any) {
    return this.inventoryService.processDelivery(dto, req.user?.id);
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
