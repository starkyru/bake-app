import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatRadioModule } from '@angular/material/radio';
import {
  BakeDataTableComponent,
  BakePageContainerComponent,
  BakeConfirmationService,
  BakeToastService,
  TableColumn,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import {
  Product as SharedProduct,
  Category as SharedCategory,
  Recipe as SharedRecipe,
  Ingredient as SharedIngredient,
} from '@bake-app/shared-types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface MenuItemData {
  id: string;
  name: string;
  sku: string;
  type: string;
  typeLabel: string;
  category: string;
  categoryId: string;
  linkedTo: string;
  price: number;
  cost: number;
  margin: string;
  status: string;
  actions: string;
  recipeId?: string;
  ingredientId?: string;
  description?: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface RecipeOption {
  id: string;
  name: string;
  costPerUnit: number;
}

interface IngredientOption {
  id: string;
  name: string;
  costPerUnit: number;
}

interface MenuDialogData {
  mode: 'create' | 'edit';
  item?: MenuItemData;
  categories: CategoryOption[];
  recipes: RecipeOption[];
  ingredients: IngredientOption[];
}

@Component({
  selector: 'bake-app-menu-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatRadioModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'Add Menu Item' : 'Edit Menu Item' }}
    </h2>
    <mat-dialog-content class="dialog-content">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="name" placeholder="Menu item name" />
      </mat-form-field>

      <div class="type-section">
        <label class="type-label">Type</label>
        <mat-radio-group [(ngModel)]="type" class="type-group">
          <mat-radio-button value="produced">
            <span class="type-option">
              <mat-icon class="type-icon">bakery_dining</mat-icon>
              Produced in bakery
            </span>
          </mat-radio-button>
          <mat-radio-button value="bought_for_resale">
            <span class="type-option">
              <mat-icon class="type-icon">local_shipping</mat-icon>
              Bought for resale
            </span>
          </mat-radio-button>
        </mat-radio-group>
      </div>

      <div class="form-row">
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>SKU</mat-label>
          <input matInput [(ngModel)]="sku" placeholder="BK-001" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Category</mat-label>
          <mat-select [(ngModel)]="categoryId">
            <mat-option *ngFor="let cat of categories" [value]="cat.id">
              {{ cat.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Produced: recipe selection + sell price -->
      <ng-container *ngIf="type === 'produced'">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Recipe</mat-label>
          <input
            matInput
            [(ngModel)]="recipeSearch"
            [matAutocomplete]="recipeAuto"
            placeholder="Search recipes..."
            (ngModelChange)="filterRecipes()"
          />
          <mat-icon matSuffix>search</mat-icon>
          <mat-autocomplete
            #recipeAuto="matAutocomplete"
            [displayWith]="displayRecipe.bind(this)"
            (optionSelected)="onRecipeSelected($event.option.value)"
          >
            <mat-option *ngFor="let r of filteredRecipes" [value]="r.id">
              {{ r.name }}
              <span class="option-detail"> — cost {{ r.costPerUnit | currency }}</span>
            </mat-option>
          </mat-autocomplete>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Sell Price ($)</mat-label>
            <input matInput type="number" [(ngModel)]="price" placeholder="0" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Cost Price ($)</mat-label>
            <input matInput type="number" [(ngModel)]="cost" placeholder="Auto from recipe" />
          </mat-form-field>
        </div>
      </ng-container>

      <!-- Bought for resale: ingredient selection -->
      <ng-container *ngIf="type === 'bought_for_resale'">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Linked Inventory Item</mat-label>
          <input
            matInput
            [(ngModel)]="ingredientSearch"
            [matAutocomplete]="ingredientAuto"
            placeholder="Search ingredients..."
            (ngModelChange)="filterIngredients()"
          />
          <mat-icon matSuffix>search</mat-icon>
          <mat-autocomplete
            #ingredientAuto="matAutocomplete"
            [displayWith]="displayIngredient.bind(this)"
            (optionSelected)="onIngredientSelected($event.option.value)"
          >
            <mat-option *ngFor="let i of filteredIngredients" [value]="i.id">
              {{ i.name }}
              <span class="option-detail"> — cost {{ i.costPerUnit | currency }}/unit</span>
            </mat-option>
          </mat-autocomplete>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Sell Price ($)</mat-label>
            <input matInput type="number" [(ngModel)]="price" placeholder="0" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Cost Price ($)</mat-label>
            <input matInput type="number" [(ngModel)]="cost" placeholder="Auto from ingredient" />
          </mat-form-field>
        </div>
      </ng-container>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <textarea
          matInput
          [(ngModel)]="description"
          rows="3"
          placeholder="Menu item description"
        ></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancel</button>
      <button mat-flat-button color="primary" (click)="onSave()" class="save-btn">
        {{ data.mode === 'create' ? 'Create' : 'Save Changes' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 500px;
        padding-top: 8px;
      }
      .form-row {
        display: flex;
        gap: 12px;
      }
      .half-width {
        flex: 1;
      }
      .full-width {
        width: 100%;
      }
      .save-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
      .type-section {
        margin-bottom: 12px;
      }
      .type-label {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.6);
        margin-bottom: 8px;
        display: block;
      }
      .type-group {
        display: flex;
        gap: 24px;
      }
      .type-option {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .type-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #8b4513;
      }
      .option-detail {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.5);
      }
    `,
  ],
})
export class MenuDialogComponent {
  name = '';
  sku = '';
  type = 'produced';
  categoryId = '';
  price = 0;
  cost = 0;
  description = '';
  recipeId = '';
  ingredientId = '';
  recipeSearch = '';
  ingredientSearch = '';
  categories: CategoryOption[] = [];
  recipes: RecipeOption[] = [];
  ingredients: IngredientOption[] = [];
  filteredRecipes: RecipeOption[] = [];
  filteredIngredients: IngredientOption[] = [];

  constructor(
    public dialogRef: MatDialogRef<MenuDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MenuDialogData,
  ) {
    this.categories = data.categories || [];
    this.recipes = data.recipes || [];
    this.ingredients = data.ingredients || [];
    this.filteredRecipes = [...this.recipes];
    this.filteredIngredients = [...this.ingredients];

    if (data.item) {
      this.name = data.item.name;
      this.sku = data.item.sku;
      this.type = data.item.type || 'produced';
      this.categoryId = data.item.categoryId;
      this.price = data.item.price;
      this.cost = data.item.cost;
      this.description = data.item.description || '';
      this.recipeId = data.item.recipeId || '';
      this.ingredientId = data.item.ingredientId || '';
      this.recipeSearch = this.recipeId;
      this.ingredientSearch = this.ingredientId;
    }
  }

  filterRecipes(): void {
    const search = this.recipeSearch?.toLowerCase() || '';
    this.filteredRecipes = this.recipes.filter((r) =>
      r.name.toLowerCase().includes(search),
    );
  }

  filterIngredients(): void {
    const search = this.ingredientSearch?.toLowerCase() || '';
    this.filteredIngredients = this.ingredients.filter((i) =>
      i.name.toLowerCase().includes(search),
    );
  }

  displayRecipe(id: string): string {
    const recipe = this.recipes.find((r) => r.id === id);
    return recipe ? recipe.name : '';
  }

  displayIngredient(id: string): string {
    const ingredient = this.ingredients.find((i) => i.id === id);
    return ingredient ? ingredient.name : '';
  }

  onRecipeSelected(id: string): void {
    this.recipeId = id;
    const recipe = this.recipes.find((r) => r.id === id);
    if (recipe && recipe.costPerUnit > 0) {
      this.cost = recipe.costPerUnit;
    }
  }

  onIngredientSelected(id: string): void {
    this.ingredientId = id;
    const ingredient = this.ingredients.find((i) => i.id === id);
    if (ingredient && ingredient.costPerUnit > 0) {
      this.cost = ingredient.costPerUnit;
    }
  }

  onSave(): void {
    const result: Record<string, unknown> = {
      name: this.name,
      sku: this.sku,
      type: this.type,
      categoryId: this.categoryId,
      price: this.price,
      costPrice: this.cost,
      description: this.description,
    };

    if (this.type === 'produced') {
      result['recipeId'] = this.recipeId || null;
      result['ingredientId'] = null;
    } else {
      result['ingredientId'] = this.ingredientId || null;
      result['recipeId'] = null;
    }

    this.dialogRef.close(result);
  }
}

@Component({
  selector: 'bake-app-menu',
  standalone: true,
  imports: [
    CommonModule,
    BakeDataTableComponent,
    BakePageContainerComponent,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <bake-page-container title="Menu" subtitle="Manage your bakery menu items">
      <div class="page-actions">
        <button mat-flat-button class="add-btn" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Menu Item
        </button>
      </div>

      <bake-data-table
        [columns]="columns"
        [data]="items"
        [loading]="loading"
        (rowAction)="onRowAction($event)"
      ></bake-data-table>
    </bake-page-container>
  `,
  styles: [
    `
      .page-actions {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 16px;
      }
      .add-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
    `,
  ],
})
export class MenuComponent implements OnInit {
  loading = false;

  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'typeLabel', label: 'Type', type: 'badge', sortable: true },
    { key: 'category', label: 'Category', type: 'badge', sortable: true },
    { key: 'linkedTo', label: 'Linked To', sortable: true },
    { key: 'price', label: 'Price', type: 'currency', sortable: true },
    { key: 'cost', label: 'Cost', type: 'currency', sortable: true },
    { key: 'margin', label: 'Margin %', sortable: true },
    { key: 'status', label: 'Status', type: 'badge', sortable: true },
    { key: 'actions', label: 'Actions', type: 'actions', width: '120px' },
  ];

  items: MenuItemData[] = [];
  categories: CategoryOption[] = [];
  recipes: RecipeOption[] = [];
  ingredients: IngredientOption[] = [];

  constructor(
    private dialog: MatDialog,
    private confirmService: BakeConfirmationService,
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadRecipes();
    this.loadIngredients();
    this.loadItems();
  }

  private loadCategories(): void {
    this.apiClient.get<SharedCategory[]>('/v1/categories').subscribe({
      next: (cats) => {
        this.categories = cats.map((c) => ({ id: c.id, name: c.name }));
      },
      error: () => {
        this.categories = [];
      },
    });
  }

  private loadRecipes(): void {
    this.apiClient
      .get<PaginatedResponse<SharedRecipe>>('/v1/recipes?limit=500')
      .subscribe({
        next: (response) => {
          this.recipes = response.data.map((r) => ({
            id: r.id,
            name: r.name,
            costPerUnit: Number(r.costPerUnit),
          }));
        },
        error: () => {
          this.recipes = [];
        },
      });
  }

  private loadIngredients(): void {
    this.apiClient
      .get<PaginatedResponse<SharedIngredient>>('/v1/ingredients?limit=500')
      .subscribe({
        next: (response) => {
          this.ingredients = response.data.map((i) => ({
            id: i.id,
            name: i.name,
            costPerUnit: Number(i.costPerUnit),
          }));
        },
        error: () => {
          this.ingredients = [];
        },
      });
  }

  private loadItems(): void {
    this.loading = true;
    this.apiClient
      .get<PaginatedResponse<SharedProduct>>('/v1/products?limit=100')
      .subscribe({
        next: (response) => {
          this.items = response.data.map((p) => this.mapItem(p));
          this.loading = false;
        },
        error: () => {
          this.toastService.error('Failed to load menu items');
          this.loading = false;
        },
      });
  }

  private mapItem(p: SharedProduct): MenuItemData {
    const price = Number(p.price);
    const cost = Number(p.costPrice);
    const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
    const type = p.type || 'produced';
    const isProduced = type === 'produced';

    let linkedTo = '';
    if (isProduced && p.recipe) {
      linkedTo = `Recipe: ${p.recipe.name}`;
    } else if (!isProduced && p.ingredient) {
      linkedTo = `Ingredient: ${p.ingredient.name}`;
    }

    return {
      id: p.id,
      name: p.name,
      sku: p.sku || '',
      type,
      typeLabel: isProduced ? 'Produced' : 'Bought',
      category: p.category?.name || '',
      categoryId: p.categoryId || '',
      linkedTo,
      price,
      cost,
      margin: `${margin}%`,
      status: p.isActive ? 'Active' : 'Inactive',
      actions: '',
      recipeId: p.recipeId,
      ingredientId: p.ingredientId,
      description: p.description,
    };
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(MenuDialogComponent, {
      width: '580px',
      data: {
        mode: 'create',
        categories: this.categories,
        recipes: this.recipes,
        ingredients: this.ingredients,
      } as MenuDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiClient.post<SharedProduct>('/v1/products', result).subscribe({
          next: (created) => {
            this.items = [...this.items, this.mapItem(created)];
            this.toastService.success('Menu item created successfully');
          },
          error: () => {
            this.toastService.error('Failed to create menu item');
          },
        });
      }
    });
  }

  openEditDialog(item: MenuItemData): void {
    const dialogRef = this.dialog.open(MenuDialogComponent, {
      width: '580px',
      data: {
        mode: 'edit',
        item,
        categories: this.categories,
        recipes: this.recipes,
        ingredients: this.ingredients,
      } as MenuDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiClient
          .put<SharedProduct>(`/v1/products/${item.id}`, result)
          .subscribe({
            next: (updated) => {
              this.items = this.items.map((i) =>
                i.id === item.id ? this.mapItem(updated) : i,
              );
              this.toastService.success('Menu item updated successfully');
            },
            error: () => {
              this.toastService.error('Failed to update menu item');
            },
          });
      }
    });
  }

  onRowAction(event: { action: string; row: MenuItemData }): void {
    if (event.action === 'edit') {
      this.openEditDialog(event.row);
    } else if (event.action === 'delete') {
      this.confirmService
        .confirm({
          title: 'Delete Menu Item',
          message: `Are you sure you want to delete "${event.row.name}"? This action cannot be undone.`,
          confirmText: 'Delete',
          confirmColor: 'warn',
        })
        .subscribe((confirmed) => {
          if (confirmed) {
            this.apiClient.delete(`/v1/products/${event.row.id}`).subscribe({
              next: () => {
                this.items = this.items.filter((i) => i.id !== event.row.id);
                this.toastService.success('Menu item deleted successfully');
              },
              error: () => {
                this.toastService.error('Failed to delete menu item');
              },
            });
          }
        });
    }
  }
}
