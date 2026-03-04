import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto, UpdateRecipeDto, ScaleRecipeDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Recipes')
@Controller('api/v1/recipes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RecipesController {
  constructor(private recipesService: RecipesService) {}

  @Get()
  @RequirePermissions('recipes:read')
  @ApiOperation({ summary: 'Get all recipes' })
  findAll(@Query() query: PaginationDto) { return this.recipesService.findAll(query); }

  @Get(':id')
  @RequirePermissions('recipes:read')
  @ApiOperation({ summary: 'Get recipe by ID' })
  findOne(@Param('id') id: string) { return this.recipesService.findOne(id); }

  @Post()
  @RequirePermissions('recipes:create')
  @ApiOperation({ summary: 'Create recipe' })
  create(@Body() dto: CreateRecipeDto) { return this.recipesService.create(dto); }

  @Put(':id')
  @RequirePermissions('recipes:update')
  @ApiOperation({ summary: 'Update recipe' })
  update(@Param('id') id: string, @Body() dto: UpdateRecipeDto, @Request() req: any) {
    return this.recipesService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @RequirePermissions('recipes:delete')
  @ApiOperation({ summary: 'Delete recipe' })
  delete(@Param('id') id: string) { return this.recipesService.delete(id); }

  @Get(':id/cost')
  @RequirePermissions('recipes:read')
  @ApiOperation({ summary: 'Get recipe cost calculation' })
  getCost(@Param('id') id: string) { return this.recipesService.getCost(id); }

  @Post(':id/scale')
  @RequirePermissions('recipes:read')
  @ApiOperation({ summary: 'Scale recipe' })
  scale(@Param('id') id: string, @Body() dto: ScaleRecipeDto) {
    return this.recipesService.scaleRecipe(id, dto.scaleFactor);
  }

  @Get(':id/versions')
  @RequirePermissions('recipes:read')
  @ApiOperation({ summary: 'Get recipe version history' })
  getVersions(@Param('id') id: string) { return this.recipesService.getVersions(id); }
}
