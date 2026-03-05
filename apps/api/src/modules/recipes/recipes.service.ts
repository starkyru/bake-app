import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeLink } from './entities/recipe-link.entity';
import { RecipeVersion } from './entities/recipe-version.entity';
import { CreateRecipeDto, UpdateRecipeDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';

@Injectable()
export class RecipesService {
  private anthropic: Anthropic;

  constructor(
    @InjectRepository(Recipe) private recipeRepo: Repository<Recipe>,
    @InjectRepository(RecipeIngredient) private ingredientRepo: Repository<RecipeIngredient>,
    @InjectRepository(RecipeLink) private linkRepo: Repository<RecipeLink>,
    @InjectRepository(RecipeVersion) private versionRepo: Repository<RecipeVersion>,
    private configService: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get('ANTHROPIC_API_KEY'),
    });
  }

  async findAll(query: PaginationDto): Promise<PaginatedResponseDto<Recipe>> {
    const { page, limit, search } = query;
    const qb = this.recipeRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.ingredients', 'ingredients')
      .leftJoinAndSelect('r.links', 'links');
    if (search) qb.where('r.name ILIKE :search', { search: `%${search}%` });
    qb.andWhere('r.isActive = true').orderBy('r.name', 'ASC');
    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async findOne(id: string): Promise<Recipe> {
    const recipe = await this.recipeRepo.findOne({
      where: { id },
      relations: ['ingredients', 'links', 'versions'],
    });
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
      links: dto.links?.map(l => this.linkRepo.create(this.processLink(l))),
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
    if (dto.links) {
      await this.linkRepo.delete({ recipeId: id });
      recipe.links = dto.links.map(l => this.linkRepo.create({ ...this.processLink(l), recipeId: id }));
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

  async generateFromUrl(url: string): Promise<Partial<CreateRecipeDto>> {
    const response = await this.callAnthropic([
      {
        role: 'user',
        content: `You are a recipe parser. Given this URL to a recipe page: ${url}

Please fetch and parse the recipe from this URL and return a JSON object with the following structure:
{
  "name": "Recipe Name",
  "category": "one of: bread, pastry, cake, beverage, sandwich, other",
  "yieldQuantity": number,
  "yieldUnit": "pcs or kg or loaves or cakes or liters",
  "instructions": "Step by step instructions as plain text",
  "ingredients": [
    {
      "ingredientId": "ingredient-name-slugified",
      "ingredientName": "Ingredient Name",
      "quantity": number,
      "unit": "g or kg or ml or l or pcs or tbsp or tsp",
      "costPerUnit": 0
    }
  ],
  "links": [
    {
      "url": "${url}",
      "title": "Source recipe page title"
    }
  ]
}

Return ONLY valid JSON, no markdown, no explanation.`,
      },
    ]);

    return JSON.parse(response);
  }

  async generateFromImage(imageBase64: string, mimeType = 'image/jpeg'): Promise<Partial<CreateRecipeDto>> {
    const mediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const response = await this.callAnthropic([
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `You are a recipe parser. Look at this image of a recipe and extract all the information you can see.

Return a JSON object with the following structure:
{
  "name": "Recipe Name",
  "category": "one of: bread, pastry, cake, beverage, sandwich, other",
  "yieldQuantity": number,
  "yieldUnit": "pcs or kg or loaves or cakes or liters",
  "instructions": "Step by step instructions as plain text",
  "ingredients": [
    {
      "ingredientId": "ingredient-name-slugified",
      "ingredientName": "Ingredient Name",
      "quantity": number,
      "unit": "g or kg or ml or l or pcs or tbsp or tsp",
      "costPerUnit": 0
    }
  ]
}

Return ONLY valid JSON, no markdown, no explanation.`,
          },
        ],
      },
    ]);

    return JSON.parse(response);
  }

  private async callAnthropic(messages: any[]): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages,
      });
      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      if (!text) throw new BadRequestException('AI returned empty response');
      return text;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const message = error?.message || 'AI service error';
      if (message.includes('credit balance is too low')) {
        throw new BadRequestException('AI service: not enough credits. Please top up your Anthropic account.');
      }
      if (message.includes('invalid_api_key') || message.includes('authentication')) {
        throw new BadRequestException('AI service: invalid API key.');
      }
      if (message.includes('rate_limit') || message.includes('overloaded')) {
        throw new BadRequestException('AI service is temporarily overloaded. Please try again later.');
      }
      throw new BadRequestException(`AI service error: ${message}`);
    }
  }

  private processLink(link: { url: string; title?: string; description?: string; isYoutube?: boolean; youtubeVideoId?: string }) {
    const youtubeMatch = link.url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    return {
      ...link,
      isYoutube: !!youtubeMatch,
      youtubeVideoId: youtubeMatch ? youtubeMatch[1] : null,
    };
  }

  private async calculateCost(id: string): Promise<void> {
    const recipe = await this.recipeRepo.findOne({ where: { id }, relations: ['ingredients'] });
    if (!recipe) return;
    const totalCost = recipe.ingredients.reduce((sum, i) => sum + Number(i.quantity) * Number(i.costPerUnit), 0);
    recipe.costPerUnit = recipe.yieldQuantity > 0 ? totalCost / Number(recipe.yieldQuantity) : 0;
    await this.recipeRepo.save(recipe);
  }
}
