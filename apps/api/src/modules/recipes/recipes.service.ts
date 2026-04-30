import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeImage } from './entities/recipe-image.entity';
import { RecipeLink } from './entities/recipe-link.entity';
import { RecipeVersion } from './entities/recipe-version.entity';
import { RecipeSubRecipe } from './entities/recipe-sub-recipe.entity';
import { RecipeStorageLife } from './entities/recipe-storage-life.entity';
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

  private readonly uploadsDir: string;

  constructor(
    @InjectRepository(Recipe) private recipeRepo: Repository<Recipe>,
    @InjectRepository(RecipeIngredient) private ingredientRepo: Repository<RecipeIngredient>,
    @InjectRepository(RecipeImage) private imageRepo: Repository<RecipeImage>,
    @InjectRepository(RecipeLink) private linkRepo: Repository<RecipeLink>,
    @InjectRepository(RecipeVersion) private versionRepo: Repository<RecipeVersion>,
    @InjectRepository(RecipeSubRecipe) private subRecipeRepo: Repository<RecipeSubRecipe>,
    @InjectRepository(RecipeStorageLife) private storageLifeRepo: Repository<RecipeStorageLife>,
    @InjectRepository(InventoryMovement) private movementRepo: Repository<InventoryMovement>,
    @InjectRepository(Ingredient) private catalogIngredientRepo: Repository<Ingredient>,
    @InjectRepository(IngredientCategory) private ingredientCategoryRepo: Repository<IngredientCategory>,
    private configService: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.get('ANTHROPIC_API_KEY'),
    });
    this.uploadsDir = path.resolve(process.cwd(), 'uploads', 'recipes');
    fs.mkdirSync(this.uploadsDir, { recursive: true });
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

  async findOne(id: string, includeSubRecipes = false): Promise<Recipe> {
    const relations = ['ingredients', 'links', 'versions'];
    if (includeSubRecipes) {
      relations.push('subRecipes', 'subRecipes.subRecipe', 'storageLives', 'storageLives.storageCondition');
    }
    const recipe = await this.recipeRepo.findOne({ where: { id }, relations });
    if (!recipe) throw new NotFoundException('Recipe not found');
    return recipe;
  }

  async create(dto: CreateRecipeDto): Promise<Recipe> {
    const ingredients = dto.ingredients ? await this.resolveNewIngredients(dto.ingredients) : undefined;

    // Validate sub-recipe circular dependencies
    if (dto.subRecipes?.length) {
      for (const sr of dto.subRecipes) {
        // Can't validate full tree for a new recipe, but check self-reference won't happen
        // Full validation happens on subsequent updates
      }
    }

    const recipe = this.recipeRepo.create({
      name: dto.name,
      category: dto.category,
      yieldQuantity: dto.yieldQuantity,
      yieldUnit: dto.yieldUnit,
      instructions: dto.instructions,
      productId: dto.productId,
      roomTempHours: dto.roomTempHours,
      refrigeratedHours: dto.refrigeratedHours,
      frozenHours: dto.frozenHours,
      thawedHours: dto.thawedHours,
      ingredients: ingredients?.map(i => this.ingredientRepo.create(i)),
      links: dto.links?.map(l => this.linkRepo.create(this.processLink(l))),
      subRecipes: dto.subRecipes?.map(sr => this.subRecipeRepo.create({
        subRecipeId: sr.subRecipeId,
        quantity: sr.quantity,
        unit: sr.unit,
        note: sr.note,
        sortOrder: sr.sortOrder || 0,
      })),
      storageLives: dto.storageLives?.map(sl => this.storageLifeRepo.create({
        storageConditionId: sl.storageConditionId,
        shelfLifeHours: sl.shelfLifeHours,
      })),
    });
    const saved = await this.recipeRepo.save(recipe);
    return this.findOne(saved.id, true);
  }

  async update(id: string, dto: UpdateRecipeDto, userId?: string): Promise<Recipe> {
    const recipe = await this.findOne(id, true);
    // Save version snapshot before updating
    await this.versionRepo.save(this.versionRepo.create({
      recipeId: id,
      versionNumber: recipe.currentVersion,
      ingredientsSnapshot: recipe.ingredients.map(i => ({ ingredientId: i.ingredientId, ingredientName: i.ingredientName, quantity: i.quantity, unit: i.unit, note: i.note })),
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
    if (dto.subRecipes !== undefined) {
      // Validate circular dependencies for each new sub-recipe
      for (const sr of dto.subRecipes) {
        await this.validateNoCircularDependency(id, sr.subRecipeId);
      }
      await this.subRecipeRepo.delete({ parentRecipeId: id });
      recipe.subRecipes = dto.subRecipes.map(sr => this.subRecipeRepo.create({
        parentRecipeId: id,
        subRecipeId: sr.subRecipeId,
        quantity: sr.quantity,
        unit: sr.unit,
        note: sr.note,
        sortOrder: sr.sortOrder || 0,
      }));
    }
    if (dto.storageLives !== undefined) {
      await this.storageLifeRepo.delete({ recipeId: id });
      recipe.storageLives = dto.storageLives.map(sl => this.storageLifeRepo.create({
        recipeId: id,
        storageConditionId: sl.storageConditionId,
        shelfLifeHours: sl.shelfLifeHours,
      }));
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
      ...(dto.roomTempHours !== undefined && { roomTempHours: dto.roomTempHours }),
      ...(dto.refrigeratedHours !== undefined && { refrigeratedHours: dto.refrigeratedHours }),
      ...(dto.frozenHours !== undefined && { frozenHours: dto.frozenHours }),
      ...(dto.thawedHours !== undefined && { thawedHours: dto.thawedHours }),
      currentVersion: recipe.currentVersion + 1,
    });
    await this.recipeRepo.save(recipe);
    return this.findOne(id, true);
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
          // unitCost is total cost for the shipment; derive cost per base unit
          const costPerBaseUnit = qty > 0 ? new BigNumber(m.unitCost).div(qty).toNumber() : 0;
          deliveries.push({ qty, cost: costPerBaseUnit });
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
        note: ri.note,
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
      "quantity": number (converted to metric — grams for dry/solid ingredients, ml for liquids. Convert cups: 1 cup flour ≈ 125g, 1 cup sugar ≈ 200g, 1 cup butter ≈ 227g, 1 cup milk ≈ 240ml, 1 cup water ≈ 240ml. If the recipe provides both metric and imperial, use the metric value.),
      "unit": "one of: g, kg, ml, L, pcs, tbsp, tsp (prefer g for solids, ml for liquids)",
      "note": "optional preparation note, e.g. 'sifted', 'room temperature', 'finely chopped', 'extra large preferred'. Omit if no special note applies.",
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
  "instructions": "Step by step instructions, each step on its own line as a numbered list (1. ... 2. ... etc). Preserve the original content. If the recipe includes tips, notes, or variations, add them at the end after a blank line prefixed with 'Tip:' or 'Note:'.",
  ${ingredientSchema},
  "links": [
    {
      "url": "${url}",
      "title": "Source recipe page title"
    }
  ]
}

IMPORTANT: Include ALL ingredients listed on the page and ONLY those ingredients. Do not add ingredients that are not mentioned. Copy instructions exactly as they appear on the page.

LANGUAGE: All English text must use proper grammar — include articles (a, an, the), prepositions, and conjunctions. For example, write "Add the flour to the bowl" not "Add flour to bowl". This is especially important when translating from other languages.

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
  "instructions": "Step by step instructions, each step on its own line as a numbered list (1. ... 2. ... etc). If the recipe includes tips, notes, or variations, add them at the end after a blank line prefixed with 'Tip:' or 'Note:'.",
  ${ingredientSchema}
}

IMPORTANT: Include ALL ingredients listed in the text and ONLY those ingredients. Do not add ingredients that are not mentioned. Convert all quantities to metric (grams for solids, ml for liquids).

LANGUAGE: All English text must use proper grammar — include articles (a, an, the), prepositions, and conjunctions. For example, write "Add the flour to the bowl" not "Add flour to bowl". This is especially important when translating from other languages.

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
  "instructions": "Step by step instructions, each step on its own line as a numbered list (1. ... 2. ... etc). If the recipe includes tips, notes, or variations, add them at the end after a blank line prefixed with 'Tip:' or 'Note:'.",
  ${ingredientSchema}
}

IMPORTANT: Extract ALL ingredients visible in the image and ONLY those. Convert all quantities to metric (grams for solids, ml for liquids).

LANGUAGE: All English text must use proper grammar — include articles (a, an, the), prepositions, and conjunctions. For example, write "Add the flour to the bowl" not "Add flour to bowl". This is especially important when translating from other languages.

Return ONLY valid JSON, no markdown, no explanation.`,
          },
        ],
      },
    ]);

    return this.parseAiJson(response);
  }

  private async resolveNewIngredients(ingredients: CreateRecipeDto['ingredients']): Promise<CreateRecipeDto['ingredients']> {
    if (!ingredients) return [];
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const resolved = [];
    for (const ing of ingredients) {
      if (ing.isNew || (ing.ingredientId && !UUID_REGEX.test(ing.ingredientId))) {
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
          note: ing.note,
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
    } catch {
      throw new BadRequestException('Could not connect to the recipe page. Please paste the recipe text instead.');
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      throw new BadRequestException(
        `The site blocked our request (HTTP ${res.status}). Please copy the recipe text from the page and paste it instead.`,
      );
    }

    const html = await res.text();

    // Try to extract JSON-LD Recipe structured data first (most recipe sites embed this)
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatch) {
      for (const block of jsonLdMatch) {
        try {
          const jsonStr = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
          const data = JSON.parse(jsonStr);
          const recipe = this.findRecipeInJsonLd(data);
          if (recipe) {
            return JSON.stringify(recipe);
          }
        } catch {
          // Not valid JSON, skip
        }
      }
    }

    // Fall back to stripping HTML
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
  }

  private findRecipeInJsonLd(data: any): any | null {
    if (!data) return null;
    if (Array.isArray(data)) {
      for (const item of data) {
        const found = this.findRecipeInJsonLd(item);
        if (found) return found;
      }
      return null;
    }
    if (data['@type'] === 'Recipe') return data;
    if (data['@graph'] && Array.isArray(data['@graph'])) {
      return this.findRecipeInJsonLd(data['@graph']);
    }
    return null;
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

  // ── Recipe Images ──

  private static readonly ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

  async uploadImage(recipeId: string, file: { buffer: Buffer; originalname: string; mimetype: string; size: number }): Promise<RecipeImage> {
    await this.findOne(recipeId);
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    if (!RecipesService.ALLOWED_IMAGE_EXTS.has(ext)) {
      throw new BadRequestException(`File extension "${ext}" is not allowed. Use: ${[...RecipesService.ALLOWED_IMAGE_EXTS].join(', ')}`);
    }
    const filename = `${randomUUID()}${ext}`;
    const filePath = path.join(this.uploadsDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    const maxSort = await this.imageRepo
      .createQueryBuilder('img')
      .select('COALESCE(MAX(img.sortOrder), -1)', 'max')
      .where('img.recipeId = :recipeId', { recipeId })
      .getRawOne();

    const image = this.imageRepo.create({
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      sortOrder: (maxSort?.max ?? -1) + 1,
      recipeId,
    });
    return this.imageRepo.save(image);
  }

  async deleteImage(recipeId: string, imageId: string): Promise<void> {
    const image = await this.imageRepo.findOne({ where: { id: imageId, recipeId } });
    if (!image) throw new NotFoundException('Image not found');
    const filePath = path.join(this.uploadsDir, image.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await this.imageRepo.remove(image);
  }

  async reorderImages(recipeId: string, imageIds: string[]): Promise<void> {
    await this.findOne(recipeId);
    for (let i = 0; i < imageIds.length; i++) {
      await this.imageRepo.update(
        { id: imageIds[i], recipeId },
        { sortOrder: i },
      );
    }
  }

  // ── Sub-Recipe Management ──

  async validateNoCircularDependency(parentId: string, subRecipeId: string): Promise<void> {
    if (parentId === subRecipeId) {
      throw new BadRequestException('A recipe cannot include itself as a sub-recipe.');
    }
    const visited = new Set<string>();
    const stack = [subRecipeId];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === parentId) {
        throw new BadRequestException('Adding this sub-recipe would create a circular dependency.');
      }
      if (visited.has(current)) continue;
      visited.add(current);
      const children = await this.subRecipeRepo.find({
        where: { parentRecipeId: current },
        select: ['subRecipeId'],
      });
      for (const child of children) {
        stack.push(child.subRecipeId);
      }
    }
  }

  async getDependencyTree(recipeId: string): Promise<any> {
    const recipe = await this.recipeRepo.findOne({
      where: { id: recipeId },
      relations: ['subRecipes', 'subRecipes.subRecipe'],
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    const buildNode = async (r: Recipe, depth = 0): Promise<any> => {
      if (depth > 10) return { id: r.id, name: r.name, subRecipes: [] };
      const subs = await this.subRecipeRepo.find({
        where: { parentRecipeId: r.id },
        relations: ['subRecipe'],
        order: { sortOrder: 'ASC' },
      });
      const children = [];
      for (const sr of subs) {
        const childNode = await buildNode(sr.subRecipe, depth + 1);
        children.push({
          ...childNode,
          quantity: Number(sr.quantity),
          unit: sr.unit,
          note: sr.note,
        });
      }
      return {
        id: r.id,
        name: r.name,
        category: r.category,
        yieldQuantity: Number(r.yieldQuantity),
        yieldUnit: r.yieldUnit,
        subRecipes: children,
      };
    };

    return buildNode(recipe);
  }

  async getUsedIn(recipeId: string): Promise<RecipeSubRecipe[]> {
    return this.subRecipeRepo.find({
      where: { subRecipeId: recipeId },
      relations: ['parentRecipe'],
    });
  }

  async getCompositeCost(id: string): Promise<any> {
    const baseCost = await this.getCost(id);
    const subRecipes = await this.subRecipeRepo.find({
      where: { parentRecipeId: id },
      relations: ['subRecipe'],
    });

    const subRecipeCosts = [];
    let totalSubRecipeCost = new BigNumber(0);

    for (const sr of subRecipes) {
      const subCost = await this.getCompositeCost(sr.subRecipeId);
      const costPerYield = subCost.yieldQuantity > 0
        ? new BigNumber(subCost.totalCost).div(subCost.yieldQuantity)
        : new BigNumber(0);
      const lineCost = costPerYield.times(sr.quantity);
      totalSubRecipeCost = totalSubRecipeCost.plus(lineCost);
      subRecipeCosts.push({
        subRecipeId: sr.subRecipeId,
        subRecipeName: sr.subRecipe.name,
        quantity: Number(sr.quantity),
        unit: sr.unit,
        costPerYield: costPerYield.toNumber(),
        lineCost: lineCost.toNumber(),
      });
    }

    const totalCost = new BigNumber(baseCost.ingredientsCost).plus(totalSubRecipeCost).toNumber();

    return {
      ...baseCost,
      subRecipeCosts,
      totalSubRecipeCost: totalSubRecipeCost.toNumber(),
      totalCost,
    };
  }

  async analyzeSubRecipes(recipeData: Partial<CreateRecipeDto>): Promise<any> {
    const allRecipes = await this.recipeRepo.find({
      where: { isActive: true },
      relations: ['ingredients'],
      take: 500,
    });

    const existingRecipesSummary = allRecipes.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      ingredients: r.ingredients.map(i => i.ingredientName || i.ingredientId).join(', '),
    }));

    const response = await this.callAnthropic([
      {
        role: 'user',
        content: `You are a bakery recipe analyst. Analyze this recipe and suggest sub-recipes.

RECIPE TO ANALYZE:
${JSON.stringify(recipeData, null, 2)}

EXISTING RECIPES IN THE DATABASE:
${JSON.stringify(existingRecipesSummary, null, 2)}

Your tasks:
1. Check if any groups of ingredients in this recipe match an existing recipe from the database
2. Identify steps/ingredient groups that could be extracted as reusable sub-recipes

CRITICAL: Many recipes have the SAME ingredient appearing multiple times with different notes (e.g. "Sugar" for syrup, "Sugar" for custard, "Sugar" for meringue). You MUST use BOTH the ingredient name AND the note field to identify which specific ingredient entries belong to each sub-recipe. Do NOT group all entries with the same name together.

Return a JSON object:
{
  "suggestions": [
    {
      "type": "existing_match" | "new_suggestion",
      "existingRecipeId": "uuid (only for existing_match)",
      "existingRecipeName": "name (only for existing_match)",
      "suggestedName": "name for new sub-recipe (only for new_suggestion)",
      "matchedIngredients": [
        {"ingredientName": "Sugar", "quantity": 70, "unit": "g", "note": "for custard cream"}
      ],
      "matchedSteps": "which instruction steps relate to this sub-recipe",
      "confidence": 0.0-1.0,
      "reason": "why this should be a sub-recipe"
    }
  ]
}

IMPORTANT: Each item in matchedIngredients must be a FULL object with ingredientName, quantity, unit, and note (if present). Copy the EXACT values from the recipe's ingredient list. This is essential for correctly identifying which specific ingredient entries belong to each sub-recipe when the same ingredient name appears multiple times.

Only suggest splits that make practical sense for a bakery (e.g., cream, dough, ganache, syrup are common sub-recipes).
Return ONLY valid JSON.`,
      },
    ]);

    return this.parseAiJson(response);
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
