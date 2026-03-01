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

interface Ingredient {
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
                    <th mat-header-cell *matHeaderCellDef>Cost/Unit (&#8376;)</th>
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
                    <th mat-header-cell *matHeaderCellDef>Total (&#8376;)</th>
                    <td mat-cell *matCellDef="let row">
                      <span class="total-value">&#8376;{{ row.total | number : '1.0-0' }}</span>
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
                <span class="total-amount">&#8376;{{ totalCost | number : '1.0-0' }}</span>
              </div>
              <div class="cost-per-unit" *ngIf="yieldQuantity > 0">
                <span class="total-label">Cost per Unit:</span>
                <span class="total-amount">
                  &#8376;{{ costPerUnit | number : '1.0-0' }}
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

  categories = ['Bread', 'Pastry', 'Cake', 'Cookie', 'Beverage', 'Savory'];

  ingredientColumns = ['name', 'quantity', 'unit', 'cost', 'total', 'remove'];

  ingredients: Ingredient[] = [
    { name: '', quantity: 0, unit: 'g', cost: 0, total: 0 },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastService: BakeToastService
  ) {}

  ngOnInit(): void {
    this.recipeId = this.route.snapshot.paramMap.get('id') || 'new';
    this.isNew = this.recipeId === 'new';

    if (!this.isNew) {
      this.loadSampleRecipe();
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

  recalculate(row: Ingredient): void {
    row.total = Math.round(row.quantity * row.cost);
    // Trigger change detection by reassigning array
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
    this.toastService.success('Recipe saved successfully');
    this.router.navigate(['/recipes']);
  }

  onCancel(): void {
    this.router.navigate(['/recipes']);
  }

  private loadSampleRecipe(): void {
    // Simulate loading a recipe for editing
    this.recipeName = 'Classic Sourdough';
    this.recipeCategory = 'Bread';
    this.yieldQuantity = 10;
    this.yieldUnit = 'loaves';
    this.instructions =
      '1. Mix flour and water for autolyse (30 min)\n' +
      '2. Add starter and salt, mix until incorporated\n' +
      '3. Bulk ferment 4-5 hours with stretch & folds every 30 min\n' +
      '4. Pre-shape and bench rest 20 min\n' +
      '5. Final shape and cold proof overnight (12-16 hours)\n' +
      '6. Preheat oven to 250C with Dutch oven\n' +
      '7. Bake covered 20 min, uncovered 20-25 min until deep golden';

    this.ingredients = [
      { name: 'Bread Flour', quantity: 5000, unit: 'g', cost: 1, total: 5000 },
      { name: 'Water', quantity: 3500, unit: 'ml', cost: 0, total: 0 },
      { name: 'Sourdough Starter', quantity: 1000, unit: 'g', cost: 1, total: 1000 },
      { name: 'Salt', quantity: 100, unit: 'g', cost: 1, total: 100 },
      { name: 'Olive Oil', quantity: 50, unit: 'ml', cost: 8, total: 400 },
    ];
  }
}
