import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
  BakePageContainerComponent,
  BakeDataTableComponent,
  BakeConfirmationService,
  BakeToastService,
  TableColumn,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { IngredientCategory, Ingredient } from '@bake-app/shared-types';
import {
  IngredientFormComponent,
  IngredientFormData,
} from '../../shared/ingredient-form/ingredient-form.component';

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
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    BakePageContainerComponent,
    BakeDataTableComponent,
    IngredientFormComponent,
  ],
  template: `
    <bake-page-container
      title="Ingredients"
      subtitle="Manage ingredients used in recipes and inventory"
    >
      <div class="ingredients-layout">
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title class="form-title">
              {{ editing ? 'Edit Ingredient' : 'Add Ingredient' }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <bake-ingredient-form
              [submitLabel]="editing ? 'Update' : 'Add Ingredient'"
              [showCancel]="!!editing"
              [showPackages]="true"
              [initialData]="editFormData"
              (save)="onSave($event)"
              (cancel)="cancelEdit()"
            ></bake-ingredient-form>
          </mat-card-content>
        </mat-card>

        <mat-card class="list-card">
          <mat-card-header class="list-header">
            <mat-card-title class="list-title">All Ingredients</mat-card-title>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Category</mat-label>
              <mat-select [(ngModel)]="filterCategory" (selectionChange)="onFilterChange()">
                <mat-option value="">All</mat-option>
                <mat-option *ngFor="let cat of ingredientCategories" [value]="cat.name">
                  {{ cat.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>
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
      .list-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .filter-field {
        width: 180px;
        margin-bottom: -1.25em;
      }
      mat-card-content {
        padding-top: 12px;
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
  @ViewChild(IngredientFormComponent) formComponent!: IngredientFormComponent;
  ingredients: Ingredient[] = [];
  totalIngredients = 0;
  loading = false;
  currentPage = 1;
  pageSize = 50;
  editing: Ingredient | null = null;
  editFormData: Partial<IngredientFormData> | null = null;
  filterCategory = '';
  ingredientCategories: IngredientCategory[] = [];

  tableColumns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description', sortable: false },
    { key: 'unit', label: 'Unit', sortable: true, width: '80px' },
    {
      key: 'calories',
      label: 'Calories',
      type: 'number',
      sortable: true,
      width: '90px',
    },
    { key: 'category', label: 'Category', sortable: true, width: '120px' },
    { key: 'actions', label: '', type: 'actions', width: '100px' },
  ];

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
    this.apiClient.get<IngredientCategory[]>('/v1/ingredient-categories').subscribe({
      next: (cats) => (this.ingredientCategories = cats),
      error: () => {},
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadIngredients();
  }

  private loadIngredients(): void {
    this.loading = true;
    let url = `/v1/ingredients?page=${this.currentPage}&limit=${this.pageSize}`;
    if (this.filterCategory) {
      url += `&category=${encodeURIComponent(this.filterCategory)}`;
    }
    this.apiClient
      .get<PaginatedResponse<Ingredient>>(url)
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

  onSave(data: IngredientFormData): void {
    const dto = {
      name: data.name,
      unit: data.unit,
      description: data.description || undefined,
      calories: data.calories ?? undefined,
      category: data.category || undefined,
      packages: data.packages.map((p, i) => ({ ...p, sortOrder: i })),
    };

    if (this.editing) {
      this.apiClient
        .put<Ingredient>(`/v1/ingredients/${this.editing.id}`, dto)
        .subscribe({
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
          this.formComponent?.resetForm();
          this.loadIngredients();
        },
        error: () => this.toastService.error('Failed to create ingredient'),
      });
    }
  }

  onEdit(ing: Ingredient): void {
    this.editing = ing;
    this.editFormData = {
      name: ing.name,
      unit: ing.unit,
      description: ing.description || '',
      calories: ing.calories != null ? Number(ing.calories) : null,
      category: ing.category || '',
      packages: (ing.packages || []).map((p) => ({
        name: p.name,
        size: Number(p.size),
        unit: p.unit,
      })),
    };
  }

  cancelEdit(): void {
    this.editing = null;
    this.editFormData = null;
    this.formComponent?.resetForm();
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
