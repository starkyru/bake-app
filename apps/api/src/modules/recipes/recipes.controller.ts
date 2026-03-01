import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto, UpdateRecipeDto, ScaleRecipeDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Recipes')
@Controller('api/v1/recipes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecipesController {
  constructor(private recipesService: RecipesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all recipes' })
  findAll(@Query() query: PaginationDto) { return this.recipesService.findAll(query); }

  @Get(':id')
  @ApiOperation({ summary: 'Get recipe by ID' })
  findOne(@Param('id') id: string) { return this.recipesService.findOne(id); }

  @Post()
  @ApiOperation({ summary: 'Create recipe' })
  create(@Body() dto: CreateRecipeDto) { return this.recipesService.create(dto); }

  @Put(':id')
  @ApiOperation({ summary: 'Update recipe' })
  update(@Param('id') id: string, @Body() dto: UpdateRecipeDto, @Request() req: any) {
    return this.recipesService.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete recipe' })
  delete(@Param('id') id: string) { return this.recipesService.delete(id); }

  @Get(':id/cost')
  @ApiOperation({ summary: 'Get recipe cost calculation' })
  getCost(@Param('id') id: string) { return this.recipesService.getCost(id); }

  @Post(':id/scale')
  @ApiOperation({ summary: 'Scale recipe' })
  scale(@Param('id') id: string, @Body() dto: ScaleRecipeDto) {
    return this.recipesService.scaleRecipe(id, dto.scaleFactor);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get recipe version history' })
  getVersions(@Param('id') id: string) { return this.recipesService.getVersions(id); }
}
