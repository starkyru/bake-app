import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import {
  BakePageContainerComponent,
  BakeConfirmationService,
  BakeToastService,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { Ingredient, IngredientPackage } from '@bake-app/shared-types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Component({
  selector: 'bake-app-ingredients',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    BakePageContainerComponent,
  ],
  template: `
    <bake-page-container title="Ingredients" subtitle="Manage ingredients used in recipes and inventory">
      <div class="ingredients-layout">
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title class="form-title">
              {{ editing ? 'Edit Ingredient' : 'Add Ingredient' }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form (ngSubmit)="onSave()" class="ingredient-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Name</mat-label>
                <input matInput [(ngModel)]="formName" name="name" placeholder="e.g., Flour" required />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <input matInput [(ngModel)]="formDescription" name="description" placeholder="e.g., All-purpose wheat flour, King Arthur brand" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Unit</mat-label>
                <mat-select [(ngModel)]="formUnit" name="unit">
                  <mat-option value="g">g</mat-option>
                  <mat-option value="kg">kg</mat-option>
                  <mat-option value="ml">ml</mat-option>
                  <mat-option value="l">l</mat-option>
                  <mat-option value="pcs">pcs</mat-option>
                  <mat-option value="tbsp">tbsp</mat-option>
                  <mat-option value="tsp">tsp</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Min Stock Level</mat-label>
                <input matInput type="number" [(ngModel)]="formMinStock" name="minStock" placeholder="0" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Category</mat-label>
                <mat-select [(ngModel)]="formCategory" name="category">
                  <mat-option [value]="''">None</mat-option>
                  <mat-option *ngFor="let cat of ingredientCategories" [value]="cat">{{ cat }}</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="packages-section">
                <div class="section-label">Package Sizes</div>
                <div *ngFor="let pkg of formPackages; let i = index" class="package-row">
                  <mat-form-field appearance="outline" class="pkg-name">
                    <mat-label>Name</mat-label>
                    <input matInput [(ngModel)]="pkg.name" [name]="'pkgName' + i" placeholder="e.g., 25lb bag" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="pkg-size">
                    <mat-label>Size</mat-label>
                    <input matInput type="number" [(ngModel)]="pkg.size" [name]="'pkgSize' + i" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="pkg-unit">
                    <mat-label>Unit</mat-label>
                    <input matInput [(ngModel)]="pkg.unit" [name]="'pkgUnit' + i" placeholder="lb" />
                  </mat-form-field>
                  <button mat-icon-button type="button" color="warn" (click)="removePackage(i)">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
                <button mat-button type="button" class="add-pkg-btn" (click)="addPackage()">
                  <mat-icon>add</mat-icon> Add Package
                </button>
              </div>

              <div class="form-actions">
                <button mat-button type="button" *ngIf="editing" (click)="cancelEdit()">Cancel</button>
                <button mat-flat-button type="submit" class="save-btn">
                  {{ editing ? 'Update' : 'Add Ingredient' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <mat-card class="list-card">
          <mat-card-header>
            <mat-card-title class="list-title">All Ingredients</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-nav-list class="ingredient-list">
              <mat-list-item *ngFor="let ing of ingredients" class="ingredient-item">
                <mat-icon matListItemIcon class="ing-icon">grain</mat-icon>
                <div matListItemTitle class="item-content">
                  <div class="ing-info">
                    <span class="ing-name">{{ ing.name }}</span>
                    <span class="ing-description" *ngIf="ing.description">{{ ing.description }}</span>
                  </div>
                  <span class="ing-detail">{{ ing.unit }}</span>
                  <span class="ing-category" *ngIf="ing.category">{{ ing.category }}</span>
                  <mat-chip-set *ngIf="ing.packages?.length" class="pkg-chips">
                    <mat-chip *ngFor="let pkg of ing.packages">{{ pkg.name }}</mat-chip>
                  </mat-chip-set>
                </div>
                <div matListItemMeta class="item-actions">
                  <button mat-icon-button (click)="onEdit(ing)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="onDelete(ing)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </mat-list-item>
              <div *ngIf="ingredients.length === 0" class="empty-state">
                No ingredients yet. Add your first ingredient above.
              </div>
            </mat-nav-list>
          </mat-card-content>
        </mat-card>
      </div>
    </bake-page-container>
  `,
  styles: [
    `
      .ingredients-layout {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 24px;
        align-items: start;
      }

      .form-card,
      .list-card {
        border-radius: 12px;
      }

      .form-title,
      .list-title {
        font-size: 16px;
        font-weight: 600;
        color: #3e2723;
      }

      .ingredient-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-top: 12px;
      }

      .form-row {
        display: flex;
        gap: 12px;
      }

      .flex-1 {
        flex: 1;
      }

      .full-width {
        width: 100%;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .save-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }

      .ingredient-list {
        padding: 0;
      }

      .ingredient-item {
        border-bottom: 1px solid #f0e8dc;
      }

      .ing-icon {
        color: #8b4513;
      }

      .item-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }

      .ing-name {
        font-weight: 500;
        color: #3e2723;
      }

      .ing-detail {
        font-size: 12px;
        color: #8d6e63;
      }

      .ing-category {
        font-size: 11px;
        color: #5d4037;
        background-color: #faf3e8;
        padding: 2px 8px;
        border-radius: 12px;
      }

      .ing-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .ing-description {
        font-size: 11px;
        color: #8d6e63;
        font-weight: 400;
      }

      .pkg-chips {
        margin-left: 4px;
      }

      .pkg-chips mat-chip {
        font-size: 11px;
      }

      .packages-section {
        margin-bottom: 8px;
      }

      .section-label {
        font-size: 13px;
        font-weight: 500;
        color: #5d4037;
        margin-bottom: 8px;
      }

      .package-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .pkg-name {
        flex: 2;
      }

      .pkg-size {
        flex: 1;
      }

      .pkg-unit {
        flex: 1;
      }

      .add-pkg-btn {
        color: #8b4513;
      }

      .item-actions {
        display: flex;
        gap: 0;
      }

      .empty-state {
        text-align: center;
        color: #9e9e9e;
        padding: 32px;
        font-style: italic;
      }

      @media (max-width: 768px) {
        .ingredients-layout {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class IngredientsComponent implements OnInit {
  ingredients: Ingredient[] = [];
  editing: Ingredient | null = null;

  formName = '';
  formDescription = '';
  formUnit = 'kg';
  formMinStock = 0;
  formCategory = '';
  formPackages: { name: string; size: number; unit: string }[] = [];

  ingredientCategories = ['Dry goods', 'Dairy', 'Fats & Oils', 'Sweeteners', 'Spices', 'Fruits', 'Nuts', 'Liquids', 'Other'];

  constructor(
    private confirmService: BakeConfirmationService,
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.loadIngredients();
  }

  private loadIngredients(): void {
    this.apiClient.get<PaginatedResponse<Ingredient>>('/v1/ingredients?limit=200').subscribe({
      next: (res) => {
        this.ingredients = res.data;
      },
      error: () => {
        this.toastService.error('Failed to load ingredients');
      },
    });
  }

  onSave(): void {
    if (!this.formName.trim()) return;

    const dto = {
      name: this.formName,
      unit: this.formUnit,
      description: this.formDescription || undefined,
      minStockLevel: this.formMinStock,
      category: this.formCategory || undefined,
      packages: this.formPackages.map((p, i) => ({ ...p, sortOrder: i })),
    };

    if (this.editing) {
      this.apiClient.put<Ingredient>(`/v1/ingredients/${this.editing.id}`, dto).subscribe({
        next: (updated) => {
          this.ingredients = this.ingredients.map((i) =>
            i.id === this.editing!.id ? updated : i,
          );
          this.toastService.success('Ingredient updated');
          this.cancelEdit();
        },
        error: () => this.toastService.error('Failed to update ingredient'),
      });
    } else {
      this.apiClient.post<Ingredient>('/v1/ingredients', dto).subscribe({
        next: (created) => {
          this.ingredients = [...this.ingredients, created];
          this.toastService.success('Ingredient created');
          this.resetForm();
        },
        error: () => this.toastService.error('Failed to create ingredient'),
      });
    }
  }

  onEdit(ing: Ingredient): void {
    this.editing = ing;
    this.formName = ing.name;
    this.formDescription = ing.description || '';
    this.formUnit = ing.unit;
    this.formMinStock = Number(ing.minStockLevel);
    this.formCategory = ing.category || '';
    this.formPackages = (ing.packages || []).map((p) => ({
      name: p.name,
      size: Number(p.size),
      unit: p.unit,
    }));
  }

  cancelEdit(): void {
    this.editing = null;
    this.resetForm();
  }

  addPackage(): void {
    this.formPackages = [...this.formPackages, { name: '', size: 0, unit: '' }];
  }

  removePackage(index: number): void {
    this.formPackages = this.formPackages.filter((_, i) => i !== index);
  }

  private resetForm(): void {
    this.formName = '';
    this.formDescription = '';
    this.formUnit = 'kg';
    this.formMinStock = 0;
    this.formCategory = '';
    this.formPackages = [];
  }

  onDelete(ing: Ingredient): void {
    this.confirmService
      .confirm({
        title: 'Delete Ingredient',
        message: `Are you sure you want to delete "${ing.name}"? This may affect recipes using this ingredient.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.apiClient.delete(`/v1/ingredients/${ing.id}`).subscribe({
            next: () => {
              this.ingredients = this.ingredients.filter((i) => i.id !== ing.id);
              this.toastService.success('Ingredient deleted');
              if (this.editing?.id === ing.id) this.cancelEdit();
            },
            error: () => this.toastService.error('Failed to delete ingredient'),
          });
        }
      });
  }
}
