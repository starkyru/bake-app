import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeVersion } from './entities/recipe-version.entity';
import { CreateRecipeDto, UpdateRecipeDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe) private recipeRepo: Repository<Recipe>,
    @InjectRepository(RecipeIngredient) private ingredientRepo: Repository<RecipeIngredient>,
    @InjectRepository(RecipeVersion) private versionRepo: Repository<RecipeVersion>,
  ) {}

  async findAll(query: PaginationDto): Promise<PaginatedResponseDto<Recipe>> {
    const { page, limit, search } = query;
    const qb = this.recipeRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.ingredients', 'ingredients');
    if (search) qb.where('r.name ILIKE :search', { search: `%${search}%` });
    qb.andWhere('r.isActive = true').orderBy('r.name', 'ASC');
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<Recipe> {
    const recipe = await this.recipeRepo.findOne({ where: { id }, relations: ['ingredients', 'versions'] });
    if (!recipe) throw new NotFoundException('Recipe not found');
    return recipe;
  }

  async create(dto: CreateRecipeDto): Promise<Recipe> {
    const recipe = this.recipeRepo.create({
      name: dto.name,
      category: dto.category,
      yieldQuantity: dto.yieldQuantity,
      yieldUnit: dto.yieldUnit,
      instructions: dto.instructions,
      productId: dto.productId,
      ingredients: dto.ingredients?.map(i => this.ingredientRepo.create(i)),
    });
    const saved = await this.recipeRepo.save(recipe);
    await this.calculateCost(saved.id);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateRecipeDto, userId?: string): Promise<Recipe> {
    const recipe = await this.findOne(id);
    // Save version snapshot before updating
    await this.versionRepo.save(this.versionRepo.create({
      recipeId: id,
      versionNumber: recipe.currentVersion,
      ingredientsSnapshot: recipe.ingredients.map(i => ({ ingredientId: i.ingredientId, ingredientName: i.ingredientName, quantity: i.quantity, unit: i.unit, costPerUnit: i.costPerUnit })),
      instructionsSnapshot: recipe.instructions,
      changedById: userId,
    }));

    if (dto.ingredients) {
      await this.ingredientRepo.delete({ recipeId: id });
      recipe.ingredients = dto.ingredients.map(i => this.ingredientRepo.create({ ...i, recipeId: id }));
    }
    Object.assign(recipe, {
      ...(dto.name && { name: dto.name }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.yieldQuantity && { yieldQuantity: dto.yieldQuantity }),
      ...(dto.yieldUnit && { yieldUnit: dto.yieldUnit }),
      ...(dto.instructions !== undefined && { instructions: dto.instructions }),
      ...(dto.productId !== undefined && { productId: dto.productId }),
      currentVersion: recipe.currentVersion + 1,
    });
    await this.recipeRepo.save(recipe);
    await this.calculateCost(id);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const recipe = await this.findOne(id);
    recipe.isActive = false;
    await this.recipeRepo.save(recipe);
  }

  async getCost(id: string) {
    const recipe = await this.findOne(id);
    const totalCost = recipe.ingredients.reduce((sum, i) => sum + Number(i.quantity) * Number(i.costPerUnit), 0);
    const costPerUnit = recipe.yieldQuantity > 0 ? totalCost / Number(recipe.yieldQuantity) : 0;
    return { totalCost, costPerUnit, yieldQuantity: recipe.yieldQuantity, yieldUnit: recipe.yieldUnit, ingredients: recipe.ingredients };
  }

  async scaleRecipe(id: string, scaleFactor: number) {
    const recipe = await this.findOne(id);
    return {
      ...recipe,
      yieldQuantity: Number(recipe.yieldQuantity) * scaleFactor,
      ingredients: recipe.ingredients.map(i => ({ ...i, quantity: Number(i.quantity) * scaleFactor })),
    };
  }

  async getVersions(id: string): Promise<RecipeVersion[]> {
    return this.versionRepo.find({ where: { recipeId: id }, order: { versionNumber: 'DESC' } });
  }

  private async calculateCost(id: string): Promise<void> {
    const recipe = await this.recipeRepo.findOne({ where: { id }, relations: ['ingredients'] });
    if (!recipe) return;
    const totalCost = recipe.ingredients.reduce((sum, i) => sum + Number(i.quantity) * Number(i.costPerUnit), 0);
    recipe.costPerUnit = recipe.yieldQuantity > 0 ? totalCost / Number(recipe.yieldQuantity) : 0;
    await this.recipeRepo.save(recipe);
  }
}
