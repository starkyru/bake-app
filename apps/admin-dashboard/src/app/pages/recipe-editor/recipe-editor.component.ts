import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BakePageContainerComponent, BakeToastService } from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { Recipe, Category as SharedCategory } from '@bake-app/shared-types';

interface IngredientRow {
  ingredientId?: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  total: number;
}

interface LinkRow {
  url: string;
  title: string;
  isYoutube: boolean;
  youtubeVideoId: string;
  editing: boolean;
}

@Component({
  selector: 'bake-app-recipe-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDividerModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    BakePageContainerComponent,
  ],
  template: `
    <bake-page-container
      [title]="isNew ? 'New Recipe' : 'Edit Recipe'"
      subtitle="Define ingredients, quantities, and instructions"
    >
      <div class="editor-layout">
        <!-- AI Generation Card -->
        <mat-card class="ai-card">
          <mat-card-content>
            <div class="section-header">
              <h3 class="section-title">AI Generate Recipe</h3>
            </div>
            <p class="ai-hint">Generate recipe data from a URL or image using AI</p>
            <div class="ai-actions">
              <div class="ai-url-row">
                <mat-form-field appearance="outline" class="flex-2">
                  <mat-label>Recipe URL</mat-label>
                  <input
                    matInput
                    [(ngModel)]="aiUrl"
                    placeholder="https://example.com/recipe/croissant"
                  />
                </mat-form-field>
                <button
                  mat-stroked-button
                  class="ai-btn"
                  (click)="generateFromUrl()"
                  [disabled]="aiLoading || !aiUrl.trim()"
                >
                  <mat-icon>auto_awesome</mat-icon>
                  Generate from URL
                </button>
              </div>
              <div class="ai-image-row">
                <button mat-stroked-button class="ai-btn" (click)="fileInput.click()" [disabled]="aiLoading">
                  <mat-icon>image</mat-icon>
                  Generate from Image
                </button>
                <input
                  #fileInput
                  type="file"
                  accept="image/*"
                  (change)="onImageSelected($event)"
                  style="display: none"
                />
                <span class="ai-filename" *ngIf="aiImageName">{{ aiImageName }}</span>
              </div>
              <mat-spinner *ngIf="aiLoading" diameter="24"></mat-spinner>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="editor-card">
          <mat-card-content>
            <div class="form-section">
              <h3 class="section-title">Basic Information</h3>
              <div class="form-row">
                <mat-form-field appearance="outline" class="flex-2">
                  <mat-label>Recipe Name</mat-label>
                  <input matInput [(ngModel)]="recipeName" placeholder="Recipe name" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Category</mat-label>
                  <mat-select [(ngModel)]="recipeCategory">
                    <mat-option *ngFor="let cat of categories" [value]="cat">
                      {{ cat }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="form-row">
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Yield Quantity</mat-label>
                  <input
                    matInput
                    type="number"
                    [(ngModel)]="yieldQuantity"
                    placeholder="10"
                  />
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Yield Unit</mat-label>
                  <mat-select [(ngModel)]="yieldUnit">
                    <mat-option value="pcs">Pieces</mat-option>
                    <mat-option value="loaves">Loaves</mat-option>
                    <mat-option value="cakes">Cakes</mat-option>
                    <mat-option value="kg">Kilograms</mat-option>
                    <mat-option value="liters">Liters</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <mat-divider class="section-divider"></mat-divider>

            <div class="form-section">
              <div class="section-header">
                <h3 class="section-title">Ingredients</h3>
                <button mat-stroked-button class="add-btn" (click)="addIngredient()">
                  <mat-icon>add</mat-icon>
                  Add Ingredient
                </button>
              </div>

              <div class="ingredients-table-wrapper">
                <table mat-table [dataSource]="ingredients" class="ingredients-table">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Ingredient</th>
                    <td mat-cell *matCellDef="let row; let i = index">
                      <mat-form-field appearance="outline" class="table-field">
                        <input
                          matInput
                          [(ngModel)]="row.name"
                          placeholder="Ingredient name"
                        />
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="quantity">
                    <th mat-header-cell *matHeaderCellDef>Quantity</th>
                    <td mat-cell *matCellDef="let row">
                      <mat-form-field appearance="outline" class="table-field narrow">
                        <input
                          matInput
                          type="number"
                          [(ngModel)]="row.quantity"
                          (ngModelChange)="recalculate(row)"
                          placeholder="0"
                        />
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="unit">
                    <th mat-header-cell *matHeaderCellDef>Unit</th>
                    <td mat-cell *matCellDef="let row">
                      <mat-form-field appearance="outline" class="table-field narrow">
                        <mat-select [(ngModel)]="row.unit">
                          <mat-option value="g">g</mat-option>
                          <mat-option value="kg">kg</mat-option>
                          <mat-option value="ml">ml</mat-option>
                          <mat-option value="l">l</mat-option>
                          <mat-option value="pcs">pcs</mat-option>
                          <mat-option value="tbsp">tbsp</mat-option>
                          <mat-option value="tsp">tsp</mat-option>
                        </mat-select>
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="cost">
                    <th mat-header-cell *matHeaderCellDef>Cost/Unit ($)</th>
                    <td mat-cell *matCellDef="let row">
                      <mat-form-field appearance="outline" class="table-field narrow">
                        <input
                          matInput
                          type="number"
                          [(ngModel)]="row.cost"
                          (ngModelChange)="recalculate(row)"
                          placeholder="0"
                        />
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="total">
                    <th mat-header-cell *matHeaderCellDef>Total ($)</th>
                    <td mat-cell *matCellDef="let row">
                      <span class="total-value">{{ row.total | currency:'USD':'symbol':'1.0-0' }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="remove">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let row; let i = index">
                      <button
                        mat-icon-button
                        color="warn"
                        (click)="removeIngredient(i)"
                        [disabled]="ingredients.length <= 1"
                      >
                        <mat-icon>close</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="ingredientColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: ingredientColumns"></tr>
                </table>
              </div>

              <div class="total-cost">
                <span class="total-label">Total Recipe Cost:</span>
                <span class="total-amount">{{ totalCost | currency:'USD':'symbol':'1.0-0' }}</span>
              </div>
              <div class="cost-per-unit" *ngIf="yieldQuantity > 0">
                <span class="total-label">Cost per Unit:</span>
                <span class="total-amount">
                  {{ costPerUnit | currency:'USD':'symbol':'1.0-0' }}
                </span>
              </div>
            </div>

            <mat-divider class="section-divider"></mat-divider>

            <div class="form-section">
              <div class="section-header">
                <h3 class="section-title">Links</h3>
                <button mat-stroked-button class="add-btn" (click)="addLink()">
                  <mat-icon>add</mat-icon>
                  Add Link
                </button>
              </div>

              <div class="links-list">
                <div *ngFor="let link of links; let i = index" class="link-item">
                  <div class="link-row">
                    <div class="link-fields" *ngIf="link.editing">
                      <mat-form-field appearance="outline" class="flex-2">
                        <mat-label>URL</mat-label>
                        <input
                          matInput
                          [(ngModel)]="link.url"
                          (ngModelChange)="onLinkUrlChange(link)"
                          placeholder="https://..."
                        />
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="flex-2">
                        <mat-label>Title</mat-label>
                        <input matInput [(ngModel)]="link.title" placeholder="Link title" />
                      </mat-form-field>
                      <button mat-icon-button color="primary" (click)="link.editing = false">
                        <mat-icon>check</mat-icon>
                      </button>
                    </div>
                    <div class="link-display" *ngIf="!link.editing">
                      <mat-icon class="link-type-icon">
                        {{ link.isYoutube ? 'play_circle' : 'link' }}
                      </mat-icon>
                      <div class="link-info">
                        <span class="link-title">{{ link.title || link.url }}</span>
                        <a class="link-url" [href]="link.url" target="_blank">{{ link.url }}</a>
                      </div>
                      <button mat-icon-button (click)="link.editing = true">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="removeLink(i)">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  </div>

                  <mat-accordion *ngIf="link.isYoutube && link.youtubeVideoId && !link.editing">
                    <mat-expansion-panel>
                      <mat-expansion-panel-header>
                        <mat-panel-title>
                          <mat-icon>play_circle</mat-icon>
                          Watch Video
                        </mat-panel-title>
                      </mat-expansion-panel-header>
                      <div class="youtube-embed">
                        <iframe
                          [src]="getYoutubeEmbedUrl(link.youtubeVideoId)"
                          frameborder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowfullscreen
                        ></iframe>
                      </div>
                    </mat-expansion-panel>
                  </mat-accordion>
                </div>

                <div *ngIf="links.length === 0" class="no-links">
                  No links added yet
                </div>
              </div>
            </div>

            <mat-divider class="section-divider"></mat-divider>

            <div class="form-section">
              <h3 class="section-title">Instructions</h3>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Preparation Instructions</mat-label>
                <textarea
                  matInput
                  [(ngModel)]="instructions"
                  rows="8"
                  placeholder="Step-by-step preparation instructions..."
                ></textarea>
              </mat-form-field>
            </div>

            <div class="editor-actions">
              <button mat-button (click)="onCancel()">Cancel</button>
              <button mat-flat-button class="save-btn" (click)="onSave()">
                <mat-icon>save</mat-icon>
                Save Recipe
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </bake-page-container>
  `,
  styles: [
    `
      .editor-layout {
        max-width: 900px;
      }

      .ai-card {
        border-radius: 12px;
        padding: 8px;
        margin-bottom: 24px;
        border: 1px dashed #8b4513;
        background: #fdf8f0;
      }

      .ai-hint {
        color: #5d4037;
        font-size: 13px;
        margin: 0 0 16px;
      }

      .ai-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ai-url-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }

      .ai-image-row {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .ai-btn {
        color: #8b4513;
        border-color: #8b4513;
        white-space: nowrap;
        height: 56px;
      }

      .ai-filename {
        font-size: 13px;
        color: #5d4037;
      }

      .editor-card {
        border-radius: 12px;
        padding: 8px;
      }

      .form-section {
        margin-bottom: 8px;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #3e2723;
        margin: 0 0 16px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-header .section-title {
        margin: 0;
      }

      .section-divider {
        margin: 24px 0;
      }

      .form-row {
        display: flex;
        gap: 16px;
      }

      .flex-1 {
        flex: 1;
      }

      .flex-2 {
        flex: 2;
      }

      .full-width {
        width: 100%;
      }

      .add-btn {
        color: #8b4513;
        border-color: #8b4513;
      }

      .ingredients-table-wrapper {
        overflow-x: auto;
        border: 1px solid #e0d6c8;
        border-radius: 8px;
        margin-bottom: 16px;
      }

      .ingredients-table {
        width: 100%;
      }

      .table-field {
        width: 100%;
        margin: 4px 0;
      }

      .table-field.narrow {
        max-width: 120px;
      }

      ::ng-deep .table-field .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }

      .total-value {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 600;
        color: #3e2723;
      }

      .total-cost,
      .cost-per-unit {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 16px;
        padding: 8px 0;
      }

      .total-label {
        font-weight: 500;
        color: #5d4037;
      }

      .total-amount {
        font-family: 'JetBrains Mono', monospace;
        font-size: 18px;
        font-weight: 700;
        color: #8b4513;
      }

      .cost-per-unit .total-amount {
        font-size: 14px;
        color: #5d4037;
      }

      /* Links section */
      .links-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .link-item {
        border: 1px solid #e0d6c8;
        border-radius: 8px;
        overflow: hidden;
      }

      .link-row {
        padding: 12px 16px;
      }

      .link-fields {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }

      .link-display {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .link-type-icon {
        color: #8b4513;
        flex-shrink: 0;
      }

      .link-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .link-title {
        font-weight: 500;
        color: #3e2723;
      }

      .link-url {
        font-size: 12px;
        color: #8b4513;
        text-decoration: none;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .link-url:hover {
        text-decoration: underline;
      }

      .no-links {
        text-align: center;
        color: #9e9e9e;
        padding: 24px;
        font-style: italic;
      }

      .youtube-embed {
        position: relative;
        padding-bottom: 56.25%;
        height: 0;
        overflow: hidden;
      }

      .youtube-embed iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 8px;
      }

      ::ng-deep .link-item .mat-expansion-panel {
        box-shadow: none !important;
        border-top: 1px solid #e0d6c8;
      }

      ::ng-deep .link-item .mat-expansion-panel-header {
        padding: 0 16px;
      }

      ::ng-deep .link-item .mat-expansion-panel-body {
        padding: 0 16px 16px;
      }

      ::ng-deep .link-item .mat-panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #8b4513;
        font-size: 14px;
      }

      .editor-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
      }

      .save-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
    `,
  ],
})
export class RecipeEditorComponent implements OnInit {
  recipeId = '';
  isNew = true;
  recipeName = '';
  recipeCategory = '';
  yieldQuantity = 0;
  yieldUnit = 'pcs';
  instructions = '';

  categories: string[] = [];

  ingredientColumns = ['name', 'quantity', 'unit', 'cost', 'total', 'remove'];

  ingredients: IngredientRow[] = [
    { name: '', quantity: 0, unit: 'g', cost: 0, total: 0 },
  ];

  links: LinkRow[] = [];

  // AI generation
  aiUrl = '';
  aiImageName = '';
  aiLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.recipeId = this.route.snapshot.paramMap.get('id') || 'new';
    this.isNew = this.recipeId === 'new';

    this.loadCategories();

    if (!this.isNew) {
      this.loadRecipe();
    }
  }

  private loadCategories(): void {
    this.apiClient.get<SharedCategory[]>('/v1/categories').subscribe({
      next: (cats) => {
        this.categories = cats.map((c) => c.name);
      },
      error: () => {
        this.categories = [];
      },
    });
  }

  private loadRecipe(): void {
    this.apiClient.get<Recipe>(`/v1/recipes/${this.recipeId}`).subscribe({
      next: (recipe) => {
        this.applyRecipeData(recipe);
      },
      error: () => {
        this.toastService.error('Failed to load recipe');
        this.router.navigate(['/recipes']);
      },
    });
  }

  private applyRecipeData(recipe: Partial<Recipe>): void {
    if (recipe.name) this.recipeName = recipe.name;
    if (recipe.category !== undefined) this.recipeCategory = recipe.category || '';
    if (recipe.yieldQuantity !== undefined) this.yieldQuantity = recipe.yieldQuantity;
    if (recipe.yieldUnit) this.yieldUnit = recipe.yieldUnit;
    if (recipe.instructions !== undefined) this.instructions = recipe.instructions || '';
    if (recipe.ingredients?.length) {
      this.ingredients = recipe.ingredients.map((ing) => ({
        ingredientId: ing.ingredientId,
        name: ing.ingredientName || '',
        quantity: ing.quantity,
        unit: ing.unit,
        cost: Number(ing.costPerUnit),
        total: Math.round(ing.quantity * Number(ing.costPerUnit)),
      }));
    }
    if (this.ingredients.length === 0 || (this.ingredients.length === 1 && !this.ingredients[0].name)) {
      this.ingredients = [{ name: '', quantity: 0, unit: 'g', cost: 0, total: 0 }];
    }
    if (recipe.links?.length) {
      this.links = recipe.links.map((l) => ({
        url: l.url,
        title: l.title || '',
        isYoutube: l.isYoutube,
        youtubeVideoId: l.youtubeVideoId || '',
        editing: false,
      }));
    }
  }

  get totalCost(): number {
    return this.ingredients.reduce((sum, ing) => sum + (ing.total || 0), 0);
  }

  get costPerUnit(): number {
    return this.yieldQuantity > 0
      ? Math.round(this.totalCost / this.yieldQuantity)
      : 0;
  }

  recalculate(row: IngredientRow): void {
    row.total = Math.round(row.quantity * row.cost);
    this.ingredients = [...this.ingredients];
  }

  addIngredient(): void {
    this.ingredients = [
      ...this.ingredients,
      { name: '', quantity: 0, unit: 'g', cost: 0, total: 0 },
    ];
  }

  removeIngredient(index: number): void {
    this.ingredients = this.ingredients.filter((_, i) => i !== index);
  }

  // Links management
  addLink(): void {
    this.links = [
      ...this.links,
      { url: '', title: '', isYoutube: false, youtubeVideoId: '', editing: true },
    ];
  }

  removeLink(index: number): void {
    this.links = this.links.filter((_, i) => i !== index);
  }

  onLinkUrlChange(link: LinkRow): void {
    const match = link.url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    link.isYoutube = !!match;
    link.youtubeVideoId = match ? match[1] : '';
  }

  getYoutubeEmbedUrl(videoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${videoId}`,
    );
  }

  // AI generation
  generateFromUrl(): void {
    if (!this.aiUrl.trim()) return;
    this.aiLoading = true;
    this.apiClient.post<Partial<Recipe>>('/v1/recipes/generate/from-url', { url: this.aiUrl }).subscribe({
      next: (data) => {
        this.applyRecipeData(data as Partial<Recipe>);
        this.toastService.success('Recipe generated from URL');
        this.aiLoading = false;
      },
      error: (err: any) => {
        this.toastService.error(err?.error?.message || 'Failed to generate recipe from URL');
        this.aiLoading = false;
      },
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.aiImageName = file.name;
    this.aiLoading = true;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      const mimeType = file.type || 'image/jpeg';

      this.apiClient
        .post<Partial<Recipe>>('/v1/recipes/generate/from-image', {
          imageBase64: base64,
          mimeType,
        })
        .subscribe({
          next: (data) => {
            this.applyRecipeData(data as Partial<Recipe>);
            this.toastService.success('Recipe generated from image');
            this.aiLoading = false;
          },
          error: (err: any) => {
            this.toastService.error(err?.error?.message || 'Failed to generate recipe from image');
            this.aiLoading = false;
          },
        });
    };
    reader.readAsDataURL(file);
  }

  onSave(): void {
    if (!this.recipeName.trim()) {
      this.toastService.warning('Please enter a recipe name');
      return;
    }

    const dto = {
      name: this.recipeName,
      category: this.recipeCategory,
      yieldQuantity: this.yieldQuantity,
      yieldUnit: this.yieldUnit,
      instructions: this.instructions,
      ingredients: this.ingredients
        .filter((ing) => ing.name.trim())
        .map((ing) => ({
          ingredientId: ing.ingredientId || ing.name,
          ingredientName: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          costPerUnit: ing.cost,
        })),
      links: this.links
        .filter((l) => l.url.trim())
        .map((l) => ({
          url: l.url,
          title: l.title,
          isYoutube: l.isYoutube,
          youtubeVideoId: l.youtubeVideoId,
        })),
    };

    const request$ = this.isNew
      ? this.apiClient.post<Recipe>('/v1/recipes', dto)
      : this.apiClient.put<Recipe>(`/v1/recipes/${this.recipeId}`, dto);

    request$.subscribe({
      next: () => {
        this.toastService.success('Recipe saved successfully');
        this.router.navigate(['/recipes']);
      },
      error: () => {
        this.toastService.error('Failed to save recipe');
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/recipes']);
  }
}

export default RecipeEditorComponent;
