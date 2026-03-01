import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeVersion } from './entities/recipe-version.entity';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Recipe, RecipeIngredient, RecipeVersion])],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
