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
    BakePageContainerComponent,
  ],
  template: `
    <bake-page-container
      [title]="isNew ? 'New Recipe' : 'Edit Recipe'"
      subtitle="Define ingredients, quantities, and instructions"
    >
      <div class="editor-layout">
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
                <button mat-stroked-button class="add-ingredient-btn" (click)="addIngredient()">
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
                      <span class="total-value">${{ row.total | number : '1.0-0' }}</span>
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
                <span class="total-amount">${{ totalCost | number : '1.0-0' }}</span>
              </div>
              <div class="cost-per-unit" *ngIf="yieldQuantity > 0">
                <span class="total-label">Cost per Unit:</span>
                <span class="total-amount">
                  ${{ costPerUnit | number : '1.0-0' }}
                </span>
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

      .add-ingredient-btn {
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
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
        this.recipeName = recipe.name;
        this.recipeCategory = recipe.category || '';
        this.yieldQuantity = recipe.yieldQuantity;
        this.yieldUnit = recipe.yieldUnit;
        this.instructions = recipe.instructions || '';
        this.ingredients = recipe.ingredients.map((ing) => ({
          ingredientId: ing.ingredientId,
          name: ing.ingredientName || '',
          quantity: ing.quantity,
          unit: ing.unit,
          cost: Number(ing.costPerUnit),
          total: Math.round(ing.quantity * Number(ing.costPerUnit)),
        }));
        if (this.ingredients.length === 0) {
          this.ingredients = [{ name: '', quantity: 0, unit: 'g', cost: 0, total: 0 }];
        }
      },
      error: () => {
        this.toastService.error('Failed to load recipe');
        this.router.navigate(['/recipes']);
      },
    });
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
