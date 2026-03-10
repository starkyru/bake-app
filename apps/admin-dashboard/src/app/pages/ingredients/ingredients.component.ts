import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import {
  BakePageContainerComponent,
  BakeDataTableComponent,
  BakeConfirmationService,
  BakeToastService,
  TableColumn,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { Category, Ingredient } from '@bake-app/shared-types';

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
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatChipsModule,
    BakePageContainerComponent,
    BakeDataTableComponent,
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
                  <mat-option value="ml">ml</mat-option>
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
                  <mat-option *ngFor="let cat of ingredientCategories" [value]="cat.name">{{ cat.name }}</mat-option>
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
            <bake-data-table
              [columns]="tableColumns"
              [data]="ingredients"
              [loading]="loading"
              [serverSide]="true"
              [totalItems]="totalIngredients"
              [pageSize]="pageSize"
              (pageChange)="onPageChange($event)"
              (rowAction)="onTableAction($event)"
              (rowClick)="onEdit($event)"
            ></bake-data-table>
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
  totalIngredients = 0;
  loading = false;
  currentPage = 1;
  pageSize = 50;
  editing: Ingredient | null = null;

  formName = '';
  formDescription = '';
  formUnit = 'g';
  formMinStock = 0;
  formCategory = '';
  formPackages: { name: string; size: number; unit: string }[] = [];

  tableColumns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
    { key: 'unit', label: 'Unit', sortable: true, width: '80px' },
    { key: 'category', label: 'Category', sortable: true, width: '120px' },
    { key: 'minStockLevel', label: 'Min Stock', type: 'number', sortable: true, width: '100px' },
    { key: 'actions', label: '', type: 'actions', width: '100px' },
  ];

  ingredientCategories: Category[] = [];

  constructor(
    private confirmService: BakeConfirmationService,
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.loadIngredients();
    this.loadCategories();
  }

  private loadCategories(): void {
    this.apiClient.get<Category[]>('/v1/categories?type=ingredient').subscribe({
      next: (cats) => (this.ingredientCategories = cats),
      error: () => {},
    });
  }

  private loadIngredients(): void {
    this.loading = true;
    this.apiClient
      .get<PaginatedResponse<Ingredient>>(
        `/v1/ingredients?page=${this.currentPage}&limit=${this.pageSize}`,
      )
      .subscribe({
        next: (res) => {
          this.ingredients = res.data;
          this.totalIngredients = res.total;
          this.loading = false;
        },
        error: () => {
          this.toastService.error('Failed to load ingredients');
          this.loading = false;
        },
      });
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    this.loadIngredients();
  }

  onTableAction(event: { action: string; row: Ingredient }): void {
    if (event.action === 'edit') {
      this.onEdit(event.row);
    } else if (event.action === 'delete') {
      this.onDelete(event.row);
    }
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
        next: () => {
          this.toastService.success('Ingredient updated');
          this.cancelEdit();
          this.loadIngredients();
        },
        error: () => this.toastService.error('Failed to update ingredient'),
      });
    } else {
      this.apiClient.post<Ingredient>('/v1/ingredients', dto).subscribe({
        next: () => {
          this.toastService.success('Ingredient created');
          this.resetForm();
          this.loadIngredients();
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
    this.formUnit = 'g';
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
              this.toastService.success('Ingredient deleted');
              if (this.editing?.id === ing.id) this.cancelEdit();
              this.loadIngredients();
            },
            error: () => this.toastService.error('Failed to delete ingredient'),
          });
        }
      });
  }
}
