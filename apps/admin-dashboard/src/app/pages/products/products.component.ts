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
import {
  BakeDataTableComponent,
  BakePageContainerComponent,
  BakeConfirmationService,
  BakeToastService,
  TableColumn,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { Product as SharedProduct, Category as SharedCategory } from '@bake-app/shared-types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProductData {
  id: string;
  name: string;
  sku: string;
  category: string;
  categoryId: string;
  price: number;
  cost: number;
  margin: string;
  status: string;
  actions: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductDialogData {
  mode: 'create' | 'edit';
  product?: ProductData;
  categories: CategoryOption[];
}

@Component({
  selector: 'bake-app-product-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.mode === 'create' ? 'Add Product' : 'Edit Product' }}
    </h2>
    <mat-dialog-content class="dialog-content">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Product Name</mat-label>
        <input matInput [(ngModel)]="name" placeholder="Product name" />
      </mat-form-field>

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

      <div class="form-row">
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Price ($)</mat-label>
          <input matInput type="number" [(ngModel)]="price" placeholder="0" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Cost Price ($)</mat-label>
          <input matInput type="number" [(ngModel)]="cost" placeholder="0" />
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <textarea
          matInput
          [(ngModel)]="description"
          rows="3"
          placeholder="Product description"
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
        min-width: 460px;
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
    `,
  ],
})
export class ProductDialogComponent {
  name = '';
  sku = '';
  categoryId = '';
  price = 0;
  cost = 0;
  description = '';
  categories: CategoryOption[] = [];

  constructor(
    public dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDialogData,
  ) {
    this.categories = data.categories || [];
    if (data.product) {
      this.name = data.product.name;
      this.sku = data.product.sku;
      this.categoryId = data.product.categoryId;
      this.price = data.product.price;
      this.cost = data.product.cost;
    }
  }

  onSave(): void {
    this.dialogRef.close({
      name: this.name,
      sku: this.sku,
      categoryId: this.categoryId,
      price: this.price,
      costPrice: this.cost,
      description: this.description,
    });
  }
}

@Component({
  selector: 'bake-app-products',
  standalone: true,
  imports: [
    CommonModule,
    BakeDataTableComponent,
    BakePageContainerComponent,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <bake-page-container title="Products" subtitle="Manage your bakery product catalog">
      <div class="page-actions">
        <button mat-flat-button class="add-btn" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Product
        </button>
      </div>

      <bake-data-table
        [columns]="columns"
        [data]="products"
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
export class ProductsComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'category', label: 'Category', type: 'badge', sortable: true },
    { key: 'price', label: 'Price', type: 'currency', sortable: true },
    { key: 'cost', label: 'Cost', type: 'currency', sortable: true },
    { key: 'margin', label: 'Margin %', sortable: true },
    { key: 'status', label: 'Status', type: 'badge', sortable: true },
    { key: 'actions', label: 'Actions', type: 'actions', width: '120px' },
  ];

  products: ProductData[] = [];
  categories: CategoryOption[] = [];

  constructor(
    private dialog: MatDialog,
    private confirmService: BakeConfirmationService,
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
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

  private loadProducts(): void {
    this.apiClient
      .get<PaginatedResponse<SharedProduct>>('/v1/products?limit=100')
      .subscribe({
        next: (response) => {
          this.products = response.data.map((p) => this.mapProduct(p));
        },
        error: () => {
          this.toastService.error('Failed to load products');
        },
      });
  }

  private mapProduct(p: SharedProduct): ProductData {
    const price = Number(p.price);
    const cost = Number(p.costPrice);
    const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
    return {
      id: p.id,
      name: p.name,
      sku: p.sku || '',
      category: p.category?.name || '',
      categoryId: p.categoryId || '',
      price,
      cost,
      margin: `${margin}%`,
      status: p.isActive ? 'Active' : 'Inactive',
      actions: '',
    };
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '540px',
      data: { mode: 'create', categories: this.categories } as ProductDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiClient.post<SharedProduct>('/v1/products', result).subscribe({
          next: (created) => {
            this.products = [...this.products, this.mapProduct(created)];
            this.toastService.success('Product created successfully');
          },
          error: () => {
            this.toastService.error('Failed to create product');
          },
        });
      }
    });
  }

  openEditDialog(product: ProductData): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '540px',
      data: {
        mode: 'edit',
        product,
        categories: this.categories,
      } as ProductDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiClient
          .put<SharedProduct>(`/v1/products/${product.id}`, result)
          .subscribe({
            next: (updated) => {
              this.products = this.products.map((p) =>
                p.id === product.id ? this.mapProduct(updated) : p,
              );
              this.toastService.success('Product updated successfully');
            },
            error: () => {
              this.toastService.error('Failed to update product');
            },
          });
      }
    });
  }

  onRowAction(event: { action: string; row: ProductData }): void {
    if (event.action === 'edit') {
      this.openEditDialog(event.row);
    } else if (event.action === 'delete') {
      this.confirmService
        .confirm({
          title: 'Delete Product',
          message: `Are you sure you want to delete "${event.row.name}"? This action cannot be undone.`,
          confirmText: 'Delete',
          confirmColor: 'warn',
        })
        .subscribe((confirmed) => {
          if (confirmed) {
            this.apiClient.delete(`/v1/products/${event.row.id}`).subscribe({
              next: () => {
                this.products = this.products.filter((p) => p.id !== event.row.id);
                this.toastService.success('Product deleted successfully');
              },
              error: () => {
                this.toastService.error('Failed to delete product');
              },
            });
          }
        });
    }
  }
}
