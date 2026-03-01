import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateIngredientDto, UpdateIngredientDto, CreateLocationDto, UpdateLocationDto, DeliveryDto, WriteOffDto, TransferDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Inventory')
@Controller('api/v1')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get('ingredients')
  @ApiOperation({ summary: 'Get all ingredients' })
  findAllIngredients(@Query() query: PaginationDto) {
    return this.inventoryService.findAllIngredients(query);
  }

  @Post('ingredients')
  @ApiOperation({ summary: 'Create ingredient' })
  createIngredient(@Body() dto: CreateIngredientDto) {
    return this.inventoryService.createIngredient(dto);
  }

  @Put('ingredients/:id')
  @ApiOperation({ summary: 'Update ingredient' })
  updateIngredient(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.inventoryService.updateIngredient(id, dto);
  }

  @Delete('ingredients/:id')
  @ApiOperation({ summary: 'Delete ingredient' })
  deleteIngredient(@Param('id') id: string) {
    return this.inventoryService.deleteIngredient(id);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get all locations' })
  findAllLocations() {
    return this.inventoryService.findAllLocations();
  }

  @Post('locations')
  @ApiOperation({ summary: 'Create location' })
  createLocation(@Body() dto: CreateLocationDto) {
    return this.inventoryService.createLocation(dto);
  }

  @Put('locations/:id')
  @ApiOperation({ summary: 'Update location' })
  updateLocation(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.inventoryService.updateLocation(id, dto);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Get stock levels' })
  getStockLevels(@Query('locationId') locationId?: string) {
    return this.inventoryService.getStockLevels(locationId);
  }

  @Post('inventory/delivery')
  @ApiOperation({ summary: 'Process delivery' })
  processDelivery(@Body() dto: DeliveryDto, @Request() req: any) {
    return this.inventoryService.processDelivery(dto, req.user?.id);
  }

  @Post('inventory/write-off')
  @ApiOperation({ summary: 'Process write-off' })
  processWriteOff(@Body() dto: WriteOffDto, @Request() req: any) {
    return this.inventoryService.processWriteOff(dto, req.user?.id);
  }

  @Post('inventory/transfer')
  @ApiOperation({ summary: 'Process transfer' })
  processTransfer(@Body() dto: TransferDto, @Request() req: any) {
    return this.inventoryService.processTransfer(dto, req.user?.id);
  }
}
