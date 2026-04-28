import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductionBatchService } from './production-batch.service';
import { CreateProductionBatchDto, DiscardBatchDto, TransferBatchDto, ConsumeBatchDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RecipesService } from '../recipes/recipes.service';

@ApiTags('Production Batches')
@Controller('api/v1/production/batches')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProductionBatchController {
  constructor(
    private batchService: ProductionBatchService,
    private recipesService: RecipesService,
  ) {}

  @Get()
  @RequirePermissions('production:read')
  @ApiOperation({ summary: 'List production batches' })
  findAll(
    @Query('recipeId') recipeId?: string,
    @Query('locationId') locationId?: string,
    @Query('status') status?: string,
    @Query('expiringBefore') expiringBefore?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.batchService.findAll({
      recipeId,
      locationId,
      status,
      expiringBefore,
      page: Number(page) || 1,
      limit: Number(limit) || 50,
    });
  }

  @Get('stats')
  @RequirePermissions('production:read')
  @ApiOperation({ summary: 'Get batch inventory stats' })
  getStats(@Query('locationId') locationId?: string) {
    return this.batchService.getStats(locationId);
  }

  @Get('expiring-soon')
  @RequirePermissions('production:read')
  @ApiOperation({ summary: 'Get batches expiring soon' })
  getExpiringSoon(
    @Query('hours') hours?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.batchService.getExpiringSoon(Number(hours) || 24, locationId);
  }

  @Get('available/:recipeId')
  @RequirePermissions('production:read')
  @ApiOperation({ summary: 'Get available batches for a recipe' })
  getAvailableForRecipe(
    @Param('recipeId') recipeId: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.batchService.getAvailableForRecipe(recipeId, locationId);
  }

  @Get(':id')
  @RequirePermissions('production:read')
  @ApiOperation({ summary: 'Get production batch by ID' })
  findOne(@Param('id') id: string) {
    return this.batchService.findOne(id);
  }

  @Post()
  @RequirePermissions('production:create')
  @ApiOperation({ summary: 'Create production batch manually' })
  async create(@Body() dto: CreateProductionBatchDto, @Request() req: any) {
    const recipe = await this.recipesService.findOne(dto.recipeId);
    return this.batchService.create(dto, recipe, req.user?.id);
  }

  @Post(':id/consume')
  @RequirePermissions('production:update')
  @ApiOperation({ summary: 'Consume from a batch' })
  consume(@Param('id') id: string, @Body() dto: ConsumeBatchDto) {
    return this.batchService.consumeBatch(id, dto);
  }

  @Post(':id/discard')
  @RequirePermissions('production:update')
  @ApiOperation({ summary: 'Discard/write-off a batch' })
  discard(@Param('id') id: string, @Body() dto: DiscardBatchDto, @Request() req: any) {
    return this.batchService.discardBatch(id, dto, req.user?.id);
  }

  @Post(':id/transfer')
  @RequirePermissions('production:update')
  @ApiOperation({ summary: 'Transfer batch to another location' })
  transfer(@Param('id') id: string, @Body() dto: TransferBatchDto) {
    return this.batchService.transferBatch(id, dto);
  }
}
