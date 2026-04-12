import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto, UpdateRecipeDto, ScaleRecipeDto, GenerateFromUrlDto, GenerateFromImageDto, GenerateFromTextDto } from './dto';
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

  @Post()
  @RequirePermissions('recipes:create')
  @ApiOperation({ summary: 'Create recipe' })
  create(@Body() dto: CreateRecipeDto) { return this.recipesService.create(dto); }

  @Post('generate/from-url')
  @RequirePermissions('recipes:create')
  @ApiOperation({ summary: 'AI-generate recipe data from a URL' })
  generateFromUrl(@Body() dto: GenerateFromUrlDto) {
    return this.recipesService.generateFromUrl(dto.url);
  }

  @Post('generate/from-text')
  @RequirePermissions('recipes:create')
  @ApiOperation({ summary: 'AI-generate recipe data from pasted text' })
  generateFromText(@Body() dto: GenerateFromTextDto) {
    return this.recipesService.generateFromText(dto.text);
  }

  @Post('generate/from-image')
  @RequirePermissions('recipes:create')
  @ApiOperation({ summary: 'AI-generate recipe data from an uploaded image' })
  generateFromImage(@Body() dto: GenerateFromImageDto) {
    return this.recipesService.generateFromImage(dto.imageBase64, dto.mimeType);
  }

  @Get(':id')
  @RequirePermissions('recipes:read')
  @ApiOperation({ summary: 'Get recipe by ID' })
  findOne(@Param('id') id: string) { return this.recipesService.findOne(id); }

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

  @Post(':id/images')
  @RequirePermissions('recipes:update')
  @UseInterceptors(FileInterceptor('image', {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new Error('Only image files are allowed'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload recipe image' })
  uploadImage(@Param('id') id: string, @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string; size: number }) {
    return this.recipesService.uploadImage(id, file);
  }

  @Delete(':id/images/:imageId')
  @RequirePermissions('recipes:update')
  @ApiOperation({ summary: 'Delete recipe image' })
  deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.recipesService.deleteImage(id, imageId);
  }
}
