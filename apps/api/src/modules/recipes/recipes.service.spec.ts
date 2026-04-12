import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { RecipesService } from './recipes.service';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeLink } from './entities/recipe-link.entity';
import { RecipeVersion } from './entities/recipe-version.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { Ingredient } from '../inventory/entities/ingredient.entity';
import { IngredientCategory } from '../inventory/entities/ingredient-category.entity';

describe('RecipesService — getCost BigNumber precision', () => {
  let service: RecipesService;
  let recipeRepo: Record<string, jest.Mock>;
  let ingredientRepo: Record<string, jest.Mock>;
  let movementRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    recipeRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((d) => d),
      save: jest.fn((e) => Promise.resolve(e)),
      createQueryBuilder: jest.fn(),
    };
    ingredientRepo = {
      create: jest.fn((d) => d),
      save: jest.fn((e) => Promise.resolve(e)),
      delete: jest.fn(),
    };
    movementRepo = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        { provide: getRepositoryToken(Recipe), useValue: recipeRepo },
        { provide: getRepositoryToken(RecipeIngredient), useValue: ingredientRepo },
        { provide: getRepositoryToken(RecipeLink), useValue: { create: jest.fn(), save: jest.fn(), delete: jest.fn() } },
        { provide: getRepositoryToken(RecipeVersion), useValue: { find: jest.fn(), create: jest.fn(), save: jest.fn() } },
        { provide: getRepositoryToken(InventoryMovement), useValue: movementRepo },
        { provide: getRepositoryToken(Ingredient), useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn((d) => d), save: jest.fn((e) => Promise.resolve(e)) } },
        { provide: getRepositoryToken(IngredientCategory), useValue: { find: jest.fn().mockResolvedValue([]), findOne: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('fake-key') } },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
  });

  function mockRecipeWithIngredients(ingredients: { ingredientId: string; ingredientName: string; quantity: number; unit: string }[]) {
    recipeRepo.findOne.mockResolvedValue({
      id: 'recipe-1',
      name: 'Test Recipe',
      yieldQuantity: 10,
      yieldUnit: 'pcs',
      ingredients,
      links: [],
      versions: [],
    });
  }

  function mockMovements(movements: { ingredientId: string; type: string; quantity: number; unitCost: number | null; createdAt: Date }[]) {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(movements),
    };
    movementRepo.createQueryBuilder.mockReturnValue(qb);
  }

  it('should compute FIFO weighted average cost with precision', async () => {
    mockRecipeWithIngredients([
      { ingredientId: 'ing-1', ingredientName: 'Flour', quantity: 0.5, unit: 'kg' },
    ]);

    // Two deliveries: 10kg at $0.10/kg, 5kg at $0.20/kg
    // No consumption -> weighted avg = (10*0.10 + 5*0.20) / 15 = 2.0/15 = 0.13333...
    mockMovements([
      { ingredientId: 'ing-1', type: 'delivery', quantity: 10, unitCost: 0.10, createdAt: new Date('2026-01-01') },
      { ingredientId: 'ing-1', type: 'delivery', quantity: 5, unitCost: 0.20, createdAt: new Date('2026-01-02') },
    ]);

    const result = await service.getCost('recipe-1');

    // costPerUnit = (10*0.10 + 5*0.20) / 15 = 2/15
    // lineCost = 0.5 * (2/15)
    const expectedCostPerUnit = 2 / 15;
    const expectedLineCost = 0.5 * expectedCostPerUnit;

    expect(result.ingredients[0].costPerUnit).toBeCloseTo(expectedCostPerUnit, 10);
    expect(result.ingredients[0].lineCost).toBeCloseTo(expectedLineCost, 10);
    expect(typeof result.ingredients[0].costPerUnit).toBe('number');
    expect(typeof result.ingredients[0].lineCost).toBe('number');
  });

  it('should handle FIFO consumption correctly', async () => {
    mockRecipeWithIngredients([
      { ingredientId: 'ing-1', ingredientName: 'Sugar', quantity: 2, unit: 'kg' },
    ]);

    // Delivery 10kg @ $1, then usage of 8kg, then delivery 5kg @ $2
    // After FIFO consumption: first delivery has 2kg left, second has 5kg
    // Weighted avg = (2*1 + 5*2) / 7 = 12/7
    mockMovements([
      { ingredientId: 'ing-1', type: 'delivery', quantity: 10, unitCost: 1, createdAt: new Date('2026-01-01') },
      { ingredientId: 'ing-1', type: 'usage', quantity: 8, unitCost: null, createdAt: new Date('2026-01-05') },
      { ingredientId: 'ing-1', type: 'delivery', quantity: 5, unitCost: 2, createdAt: new Date('2026-01-10') },
    ]);

    const result = await service.getCost('recipe-1');

    const expectedCostPerUnit = 12 / 7;
    expect(result.ingredients[0].costPerUnit).toBeCloseTo(expectedCostPerUnit, 10);
    // lineCost = 2 * (12/7)
    expect(result.ingredients[0].lineCost).toBeCloseTo(2 * expectedCostPerUnit, 10);
  });

  it('should sum ingredientsCost across multiple ingredients without float drift', async () => {
    mockRecipeWithIngredients([
      { ingredientId: 'ing-1', ingredientName: 'A', quantity: 3, unit: 'kg' },
      { ingredientId: 'ing-2', ingredientName: 'B', quantity: 7, unit: 'kg' },
    ]);

    // ing-1: 10kg at $0.1 -> costPerUnit = 0.1, lineCost = 0.3
    // ing-2: 10kg at $0.2 -> costPerUnit = 0.2, lineCost = 1.4
    // total = 0.3 + 1.4 = 1.7 exactly
    mockMovements([
      { ingredientId: 'ing-1', type: 'delivery', quantity: 10, unitCost: 0.1, createdAt: new Date('2026-01-01') },
      { ingredientId: 'ing-2', type: 'delivery', quantity: 10, unitCost: 0.2, createdAt: new Date('2026-01-01') },
    ]);

    const result = await service.getCost('recipe-1');

    expect(result.ingredientsCost).toBe(1.7);
    expect(typeof result.ingredientsCost).toBe('number');
  });

  it('should return 0 cost when there are no movements', async () => {
    mockRecipeWithIngredients([
      { ingredientId: 'ing-1', ingredientName: 'Flour', quantity: 1, unit: 'kg' },
    ]);

    mockMovements([]);

    const result = await service.getCost('recipe-1');

    expect(result.ingredients[0].costPerUnit).toBe(0);
    expect(result.ingredients[0].lineCost).toBe(0);
    expect(result.ingredientsCost).toBe(0);
  });

  it('should return 0 cost when all stock has been consumed', async () => {
    mockRecipeWithIngredients([
      { ingredientId: 'ing-1', ingredientName: 'Flour', quantity: 1, unit: 'kg' },
    ]);

    mockMovements([
      { ingredientId: 'ing-1', type: 'delivery', quantity: 5, unitCost: 1, createdAt: new Date('2026-01-01') },
      { ingredientId: 'ing-1', type: 'usage', quantity: 5, unitCost: null, createdAt: new Date('2026-01-02') },
    ]);

    const result = await service.getCost('recipe-1');

    expect(result.ingredients[0].costPerUnit).toBe(0);
    expect(result.ingredients[0].lineCost).toBe(0);
  });

  it('should handle ingredients with no ingredientId gracefully', async () => {
    recipeRepo.findOne.mockResolvedValue({
      id: 'recipe-1',
      name: 'Simple',
      yieldQuantity: 1,
      yieldUnit: 'pcs',
      ingredients: [
        { ingredientId: null, ingredientName: 'Water', quantity: 1, unit: 'l' },
      ],
      links: [],
      versions: [],
    });

    // No ingredient IDs to query => empty movements
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    movementRepo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.getCost('recipe-1');

    expect(result.ingredients[0].costPerUnit).toBe(0);
    expect(result.ingredientsCost).toBe(0);
  });

  it('should handle precision with 0.1 + 0.2 cost accumulation', async () => {
    mockRecipeWithIngredients([
      { ingredientId: 'ing-1', ingredientName: 'A', quantity: 1, unit: 'kg' },
      { ingredientId: 'ing-2', ingredientName: 'B', quantity: 1, unit: 'kg' },
    ]);

    // ing-1 costPerUnit = 0.1, lineCost = 0.1
    // ing-2 costPerUnit = 0.2, lineCost = 0.2
    // ingredientsCost = 0.1 + 0.2 should be 0.3 exactly
    mockMovements([
      { ingredientId: 'ing-1', type: 'delivery', quantity: 10, unitCost: 0.1, createdAt: new Date('2026-01-01') },
      { ingredientId: 'ing-2', type: 'delivery', quantity: 10, unitCost: 0.2, createdAt: new Date('2026-01-01') },
    ]);

    const result = await service.getCost('recipe-1');

    expect(result.ingredientsCost).toBe(0.3);
  });
});
