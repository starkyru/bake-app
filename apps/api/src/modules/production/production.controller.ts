import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductionService } from './production.service';
import { CreateProductionPlanDto, UpdateProductionPlanDto, UpdateTaskStatusDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Production')
@Controller('api/v1/production')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProductionController {
  constructor(private productionService: ProductionService) {}

  @Get('plans')
  @RequirePermissions('production:read')
  @ApiOperation({ summary: 'Get production plans' })
  findAll(@Query('date') date?: string, @Query('locationId') locationId?: string) {
    return this.productionService.findAll(date, locationId);
  }

  @Get('plans/:id')
  @RequirePermissions('production:read')
  @ApiOperation({ summary: 'Get production plan by ID' })
  findOne(@Param('id') id: string) { return this.productionService.findOne(id); }

  @Post('plans')
  @RequirePermissions('production:create')
  @ApiOperation({ summary: 'Create production plan' })
  create(@Body() dto: CreateProductionPlanDto, @Request() req: any) {
    return this.productionService.create(dto, req.user?.id);
  }

  @Put('plans/:id')
  @RequirePermissions('production:update')
  @ApiOperation({ summary: 'Update production plan' })
  update(@Param('id') id: string, @Body() dto: UpdateProductionPlanDto) {
    return this.productionService.update(id, dto);
  }

  @Delete('plans/:id')
  @RequirePermissions('production:delete')
  @ApiOperation({ summary: 'Delete production plan' })
  delete(@Param('id') id: string) { return this.productionService.delete(id); }

  @Put('tasks/:id/status')
  @RequirePermissions('production:update')
  @ApiOperation({ summary: 'Update task status' })
  updateTaskStatus(@Param('id') id: string, @Body() dto: UpdateTaskStatusDto) {
    return this.productionService.updateTaskStatus(id, dto);
  }
}
