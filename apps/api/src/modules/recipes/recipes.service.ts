import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeLink } from './entities/recipe-link.entity';
import { RecipeVersion } from './entities/recipe-version.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { Ingredient } from '../inventory/entities/ingredient.entity';
import { IngredientCategory } from '../inventory/entities/ingredient-category.entity';
import { CreateRecipeDto, UpdateRecipeDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import BigNumber from 'bignumber.js';

@Injectable()
export class RecipesService {
  private anthropic: Anthropic;

  constructor(
    @InjectRepository(Recipe) private recipeRepo: Repository<Recipe>,
    @InjectRepository(RecipeIngredient) private ingredientRepo: Repository<RecipeIngredient>,
    @InjectRepository(RecipeLink) private linkRepo: Repository<RecipeLink>,
    @InjectRepository(RecipeVersion) private versionRepo: Repository<RecipeVersion>,
    @InjectRepository(InventoryMovement) private movementRepo: Repository<InventoryMovement>,
    @InjectRepository(Ingredient) private catalogIngredientRepo: Repository<Ingredient>,
    @InjectRepository(IngredientCategory) private ingredientCategoryRepo: Repository<IngredientCategory>,
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
    const ingredients = dto.ingredients ? await this.resolveNewIngredients(dto.ingredients) : undefined;
    const recipe = this.recipeRepo.create({
      name: dto.name,
      category: dto.category,
      yieldQuantity: dto.yieldQuantity,
      yieldUnit: dto.yieldUnit,
      instructions: dto.instructions,
      productId: dto.productId,
      ingredients: ingredients?.map(i => this.ingredientRepo.create(i)),
      links: dto.links?.map(l => this.linkRepo.create(this.processLink(l))),
    });
    const saved = await this.recipeRepo.save(recipe);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateRecipeDto, userId?: string): Promise<Recipe> {
    const recipe = await this.findOne(id);
    // Save version snapshot before updating
    await this.versionRepo.save(this.versionRepo.create({
      recipeId: id,
      versionNumber: recipe.currentVersion,
      ingredientsSnapshot: recipe.ingredients.map(i => ({ ingredientId: i.ingredientId, ingredientName: i.ingredientName, quantity: i.quantity, unit: i.unit })),
      instructionsSnapshot: recipe.instructions,
      changedById: userId,
    }));

    if (dto.ingredients) {
      const resolvedIngredients = await this.resolveNewIngredients(dto.ingredients);
      await this.ingredientRepo.delete({ recipeId: id });
      recipe.ingredients = resolvedIngredients.map(i => this.ingredientRepo.create({ ...i, recipeId: id }));
    }
    if (dto.links) {
      await this.linkRepo.delete({ recipeId: id });
      recipe.links = dto.links.map(l => this.linkRepo.create({ ...this.processLink(l), recipeId: id }));
    }
    // Remove loaded versions to prevent TypeORM from cascading updates on them
    delete recipe.versions;
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
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const recipe = await this.findOne(id);
    recipe.isActive = false;
    await this.recipeRepo.save(recipe);
  }

  async getCost(id: string) {
    const recipe = await this.findOne(id);

    // Get unique ingredient IDs from recipe
    const ingredientIds = recipe.ingredients
      .map(ri => ri.ingredientId)
      .filter(Boolean);

    // Fetch all delivery movements for these ingredients, ordered by date (FIFO)
    const movements = ingredientIds.length > 0
      ? await this.movementRepo
          .createQueryBuilder('m')
          .where('m.ingredientId IN (:...ids)', { ids: ingredientIds })
          .andWhere('m.unitCost IS NOT NULL')
          .orderBy('m.createdAt', 'ASC')
          .getMany()
      : [];

    // Build FIFO cost per ingredient: remaining stock buckets from deliveries
    // after consuming write-offs/usage from oldest first
    const fifoCostMap = new Map<string, number>();
    const grouped = new Map<string, typeof movements>();
    for (const m of movements) {
      if (!grouped.has(m.ingredientId)) grouped.set(m.ingredientId, []);
      grouped.get(m.ingredientId)!.push(m);
    }

    for (const [ingId, mvts] of grouped) {
      const deliveries: { qty: number; cost: number }[] = [];
      let consumed = 0;

      for (const m of mvts) {
        const qty = Number(m.quantity);
        if (m.type === 'delivery') {
          deliveries.push({ qty, cost: Number(m.unitCost) });
        } else {
          consumed += qty;
        }
      }

      // FIFO: consume from oldest deliveries first
      let remaining = consumed;
      for (const d of deliveries) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, d.qty);
        d.qty -= take;
        remaining -= take;
      }

      // Weighted average cost from remaining stock
      let totalQty = new BigNumber(0);
      let totalCost = new BigNumber(0);
      for (const d of deliveries) {
        if (d.qty > 0) {
          totalQty = totalQty.plus(d.qty);
          totalCost = totalCost.plus(new BigNumber(d.qty).times(d.cost));
        }
      }

      fifoCostMap.set(ingId, totalQty.gt(0) ? totalCost.div(totalQty).toNumber() : 0);
    }

    const ingredients = recipe.ingredients.map(ri => {
      const costPerUnit = fifoCostMap.get(ri.ingredientId) ?? 0;
      const lineCost = new BigNumber(ri.quantity).times(costPerUnit).toNumber();
      return {
        ingredientId: ri.ingredientId,
        ingredientName: ri.ingredientName,
        quantity: Number(ri.quantity),
        unit: ri.unit,
        costPerUnit,
        lineCost,
      };
    });
    const ingredientsCost = ingredients.reduce((sum, i) => new BigNumber(sum).plus(i.lineCost).toNumber(), 0);
    return {
      yieldQuantity: Number(recipe.yieldQuantity),
      yieldUnit: recipe.yieldUnit,
      ingredientsCost,
      ingredients,
    };
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

  private async getIngredientCategoryNames(): Promise<string[]> {
    const categories = await this.ingredientCategoryRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
    return categories.map(c => c.name);
  }

  private buildIngredientSchema(categoryNames: string[]): string {
    const categoriesHint = categoryNames.length > 0
      ? `"ingredientCategory": "one of: ${categoryNames.join(', ')}, or Uncategorized if unsure"`
      : `"ingredientCategory": "a logical category name like Dairy, Flour & Starch, Spices, Fruits, Oils & Fats, Sweeteners, etc."`;

    return `"ingredients": [
    {
      "ingredientId": "ingredient-name-slugified",
      "ingredientName": "Ingredient Name",
      "quantity": number,
      "unit": "one of: g, kg, ml, L, pcs, oz, lb, tbsp, tsp",
      ${categoriesHint}
    }
  ]`;
  }

  async generateFromUrl(url: string): Promise<Partial<CreateRecipeDto>> {
    const pageContent = await this.fetchPageContent(url);
    const categoryNames = await this.getIngredientCategoryNames();
    const ingredientSchema = this.buildIngredientSchema(categoryNames);

    const response = await this.callAnthropic([
      {
        role: 'user',
        content: `You are a recipe parser. Parse the recipe from this web page content exactly as written — do NOT add, remove, or substitute any ingredients or instructions. If the recipe is not in English, translate all text fields (name, instructions, ingredient names) to English.

Source URL: ${url}

Page content:
${pageContent}

Return a JSON object with the following structure:
{
  "name": "Recipe Name",
  "category": "one of: bread, pastry, cake, beverage, sandwich, other",
  "yieldQuantity": number,
  "yieldUnit": "pcs or kg or loaves or cakes or liters",
  "instructions": "Step by step instructions as plain text, exactly as written on the page",
  ${ingredientSchema},
  "links": [
    {
      "url": "${url}",
      "title": "Source recipe page title"
    }
  ]
}

IMPORTANT: Include ALL ingredients listed on the page and ONLY those ingredients. Do not add ingredients that are not mentioned. Copy instructions exactly as they appear on the page.

Return ONLY valid JSON, no markdown, no explanation.`,
      },
    ]);

    return this.parseAiJson(response);
  }

  async generateFromText(text: string): Promise<Partial<CreateRecipeDto>> {
    const categoryNames = await this.getIngredientCategoryNames();
    const ingredientSchema = this.buildIngredientSchema(categoryNames);

    const response = await this.callAnthropic([
      {
        role: 'user',
        content: `You are a recipe parser. Parse this recipe text and return a structured JSON object. If the recipe is not in English, translate all text fields (name, instructions, ingredient names) to English.

Recipe text:
${text}

Return a JSON object with the following structure:
{
  "name": "Recipe Name",
  "category": "one of: bread, pastry, cake, beverage, sandwich, other",
  "yieldQuantity": number,
  "yieldUnit": "pcs or kg or loaves or cakes or liters",
  "instructions": "Step by step instructions as plain text",
  ${ingredientSchema}
}

Return ONLY valid JSON, no markdown, no explanation.`,
      },
    ]);

    return this.parseAiJson(response);
  }

  async generateFromImage(imageBase64: string, mimeType = 'image/jpeg'): Promise<Partial<CreateRecipeDto>> {
    const mediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    const categoryNames = await this.getIngredientCategoryNames();
    const ingredientSchema = this.buildIngredientSchema(categoryNames);

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
            text: `You are a recipe parser. Look at this image of a recipe and extract all the information you can see. If the recipe is not in English, translate all text fields (name, instructions, ingredient names) to English.

Return a JSON object with the following structure:
{
  "name": "Recipe Name",
  "category": "one of: bread, pastry, cake, beverage, sandwich, other",
  "yieldQuantity": number,
  "yieldUnit": "pcs or kg or loaves or cakes or liters",
  "instructions": "Step by step instructions as plain text",
  ${ingredientSchema}
}

Return ONLY valid JSON, no markdown, no explanation.`,
          },
        ],
      },
    ]);

    return this.parseAiJson(response);
  }

  private async resolveNewIngredients(ingredients: CreateRecipeDto['ingredients']): Promise<CreateRecipeDto['ingredients']> {
    if (!ingredients) return [];
    const resolved = [];
    for (const ing of ingredients) {
      if (ing.isNew) {
        // Find or create the category
        let categoryId: string | undefined;
        if (ing.ingredientCategory && ing.ingredientCategory !== 'Uncategorized') {
          const existingCat = await this.ingredientCategoryRepo.findOne({
            where: { name: ing.ingredientCategory, isActive: true },
          });
          categoryId = existingCat?.id;
        }
        // Create the ingredient in the catalog
        const newIngredient = await this.catalogIngredientRepo.save(
          this.catalogIngredientRepo.create({
            name: ing.ingredientName || ing.ingredientId,
            unit: ing.unit,
            categoryId,
          }),
        );
        resolved.push({
          ingredientId: newIngredient.id,
          ingredientName: newIngredient.name,
          quantity: ing.quantity,
          unit: ing.unit,
        });
      } else {
        resolved.push(ing);
      }
    }
    return resolved;
  }

  private parseAiJson(response: string): Partial<CreateRecipeDto> {
    try {
      // Strip markdown code fences if AI wraps the JSON
      const cleaned = response.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      return JSON.parse(cleaned);
    } catch {
      throw new BadRequestException('AI returned invalid JSON. Please try again.');
    }
  }

  private async fetchPageContent(url: string): Promise<string> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BakeApp/1.0)' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      // Strip HTML tags and extract text content
      return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#\d+;/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 50000);
    } catch {
      throw new BadRequestException('Could not fetch the recipe page. Please check the URL or paste the recipe text instead.');
    }
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

}
