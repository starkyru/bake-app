import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeImage } from './entities/recipe-image.entity';
import { RecipeLink } from './entities/recipe-link.entity';
import { RecipeVersion } from './entities/recipe-version.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { Ingredient } from '../inventory/entities/ingredient.entity';
import { IngredientCategory } from '../inventory/entities/ingredient-category.entity';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Recipe, RecipeIngredient, RecipeImage, RecipeLink, RecipeVersion, InventoryMovement, Ingredient, IngredientCategory])],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
