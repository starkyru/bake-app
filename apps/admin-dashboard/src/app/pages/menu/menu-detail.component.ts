import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  BakeDataTableComponent,
  BakePageContainerComponent,
  BakeConfirmationService,
  BakeToastService,
  TableColumn,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import {
  Menu,
  Product as SharedProduct,
  Category as SharedCategory,
  Recipe as SharedRecipe,
  Ingredient as SharedIngredient,
} from '@bake-app/shared-types';
import { MenuDialogComponent } from './menu.component';

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

interface ProductOption {
  id: string;
  name: string;
  sku: string;
}

@Component({
  selector: 'bake-app-add-existing-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Add Existing Product</h2>
    <mat-dialog-content class="dialog-content">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Search Products</mat-label>
        <input
          matInput
          [(ngModel)]="searchText"
          [matAutocomplete]="productAuto"
          placeholder="Search by name or SKU..."
          (ngModelChange)="filterProducts()"
        />
        <mat-icon matSuffix>search</mat-icon>
        <mat-autocomplete
          #productAuto="matAutocomplete"
          [displayWith]="displayProduct.bind(this)"
          (optionSelected)="onProductSelected($event.option.value)"
        >
          <mat-option *ngFor="let p of filteredProducts" [value]="p.id">
            {{ p.name }}
            <span class="option-detail" *ngIf="p.sku"> — {{ p.sku }}</span>
          </mat-option>
        </mat-autocomplete>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="!selectedProductId"
        (click)="onAdd()"
        class="save-btn"
      >
        Add to Menu
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-content {
        display: flex;
        flex-direction: column;
        min-width: 400px;
        padding-top: 8px;
      }
      .full-width {
        width: 100%;
      }
      .save-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
      .option-detail {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.5);
      }
    `,
  ],
})
export class AddExistingProductDialogComponent {
  searchText = '';
  selectedProductId = '';
  products: ProductOption[] = [];
  filteredProducts: ProductOption[] = [];

  constructor(
    public dialogRef: MatDialogRef<AddExistingProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { products: ProductOption[] },
  ) {
    this.products = data.products || [];
    this.filteredProducts = [...this.products];
  }

  filterProducts(): void {
    const search = this.searchText?.toLowerCase() || '';
    this.filteredProducts = this.products.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search),
    );
  }

  displayProduct(id: string): string {
    const product = this.products.find((p) => p.id === id);
    return product ? product.name : '';
  }

  onProductSelected(id: string): void {
    this.selectedProductId = id;
  }

  onAdd(): void {
    this.dialogRef.close(this.selectedProductId);
  }
}

@Component({
  selector: 'bake-app-menu-detail',
  standalone: true,
  imports: [
    CommonModule,
    BakeDataTableComponent,
    BakePageContainerComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <bake-page-container [title]="menuName" subtitle="Menu items">
      <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>

      <div class="page-actions">
        <button mat-stroked-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Back to Menus
        </button>
        <div class="right-actions">
          <button mat-stroked-button (click)="openAddExistingDialog()">
            <mat-icon>playlist_add</mat-icon>
            Add Existing Item
          </button>
          <button mat-flat-button class="add-btn" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            Create New Item
          </button>
        </div>
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
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .right-actions {
        display: flex;
        gap: 8px;
      }
      .add-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
    `,
  ],
})
export class MenuDetailComponent implements OnInit {
  loading = false;
  saving = false;
  menuId = '';
  menuName = 'Menu';

  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'typeLabel', label: 'Type', type: 'badge', sortable: true },
    { key: 'category', label: 'Category', type: 'badge', sortable: true },
    { key: 'linkedTo', label: 'Linked To', sortable: true },
    { key: 'price', label: 'Price', type: 'currency', sortable: true },
    { key: 'cost', label: 'Cost', type: 'currency', sortable: true },
    { key: 'margin', label: 'Margin %', sortable: true },
    { key: 'actions', label: 'Actions', type: 'actions', width: '120px' },
  ];

  items: MenuItemData[] = [];
  categories: CategoryOption[] = [];
  recipes: RecipeOption[] = [];
  ingredients: IngredientOption[] = [];
  allProducts: ProductOption[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private confirmService: BakeConfirmationService,
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.menuId = this.route.snapshot.paramMap.get('id') || '';
    this.loadCategories();
    this.loadRecipes();
    this.loadIngredients();
    this.loadAllProducts();
    this.loadMenu();
  }

  goBack(): void {
    this.router.navigate(['/menu']);
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

  private loadAllProducts(): void {
    this.apiClient
      .get<PaginatedResponse<SharedProduct>>('/v1/products?limit=500')
      .subscribe({
        next: (response) => {
          this.allProducts = response.data.map((p) => ({
            id: p.id,
            name: p.name,
            sku: p.sku || '',
          }));
        },
        error: () => {
          this.allProducts = [];
        },
      });
  }

  private loadMenu(): void {
    this.loading = true;
    this.apiClient.get<Menu>(`/v1/menus/${this.menuId}`).subscribe({
      next: (menu) => {
        this.menuName = menu.name;
        this.items = (menu.menuProducts || [])
          .filter((mp) => mp.product)
          .map((mp) => this.mapItem(mp.product!));
        this.loading = false;
      },
      error: () => {
        this.toastService.error('Failed to load menu');
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

  openAddExistingDialog(): void {
    const existingIds = new Set(this.items.map((i) => i.id));
    const availableProducts = this.allProducts.filter(
      (p) => !existingIds.has(p.id),
    );

    const dialogRef = this.dialog.open(AddExistingProductDialogComponent, {
      width: '480px',
      data: { products: availableProducts },
    });

    dialogRef.afterClosed().subscribe((productId) => {
      if (productId) {
        this.saving = true;
        this.apiClient
          .post(`/v1/menus/${this.menuId}/products`, { productId })
          .subscribe({
            next: () => {
              this.toastService.success('Product added to menu');
              this.saving = false;
              this.loadMenu();
            },
            error: () => {
              this.toastService.error('Failed to add product to menu');
              this.saving = false;
            },
          });
      }
    });
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
        this.saving = true;
        this.apiClient.post<SharedProduct>('/v1/products', result).subscribe({
          next: (created) => {
            this.apiClient
              .post(`/v1/menus/${this.menuId}/products`, {
                productId: created.id,
              })
              .subscribe({
                next: () => {
                  this.items = [...this.items, this.mapItem(created)];
                  this.toastService.success(
                    'Menu item created and added to menu',
                  );
                  this.saving = false;
                },
                error: () => {
                  this.toastService.error('Product created but failed to add to menu');
                  this.saving = false;
                },
              });
          },
          error: () => {
            this.toastService.error('Failed to create menu item');
            this.saving = false;
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
        this.saving = true;
        this.apiClient
          .put<SharedProduct>(`/v1/products/${item.id}`, result)
          .subscribe({
            next: (updated) => {
              this.items = this.items.map((i) =>
                i.id === item.id ? this.mapItem(updated) : i,
              );
              this.toastService.success('Menu item updated successfully');
              this.saving = false;
            },
            error: () => {
              this.toastService.error('Failed to update menu item');
              this.saving = false;
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
          title: 'Remove from Menu',
          message: `Are you sure you want to remove "${event.row.name}" from this menu? The product itself will not be deleted.`,
          confirmText: 'Remove',
          confirmColor: 'warn',
        })
        .subscribe((confirmed) => {
          if (confirmed) {
            this.apiClient
              .delete(
                `/v1/menus/${this.menuId}/products/${event.row.id}`,
              )
              .subscribe({
                next: () => {
                  this.items = this.items.filter(
                    (i) => i.id !== event.row.id,
                  );
                  this.toastService.success('Product removed from menu');
                },
                error: () => {
                  this.toastService.error(
                    'Failed to remove product from menu',
                  );
                },
              });
          }
        });
    }
  }
}
