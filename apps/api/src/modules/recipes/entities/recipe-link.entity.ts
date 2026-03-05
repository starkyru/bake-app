import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Recipe } from './recipe.entity';

@Entity('recipe_links')
export class RecipeLink extends BaseEntity {
  @Column()
  url: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_youtube', default: false })
  isYoutube: boolean;

  @Column({ name: 'youtube_video_id', nullable: true })
  youtubeVideoId: string;

  @ManyToOne(() => Recipe, recipe => recipe.links, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe: Recipe;

  @Column({ name: 'recipe_id' })
  recipeId: string;
}
