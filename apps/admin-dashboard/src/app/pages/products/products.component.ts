import { Component, Inject } from '@angular/core';
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

interface ProductData {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  margin: string;
  status: string;
  actions: string;
}

interface ProductDialogData {
  mode: 'create' | 'edit';
  product?: ProductData;
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
          <mat-select [(ngModel)]="category">
            <mat-option *ngFor="let cat of categories" [value]="cat">
              {{ cat }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="form-row">
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Price (&#8376;)</mat-label>
          <input matInput type="number" [(ngModel)]="price" placeholder="0" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Cost Price (&#8376;)</mat-label>
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
  category = '';
  price = 0;
  cost = 0;
  description = '';
  categories = [
    'Bread',
    'Pastry',
    'Cake',
    'Cookie',
    'Beverage',
    'Sandwich',
    'Savory',
  ];

  constructor(
    public dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDialogData
  ) {
    if (data.product) {
      this.name = data.product.name;
      this.sku = data.product.sku;
      this.category = data.product.category;
      this.price = data.product.price;
      this.cost = data.product.cost;
    }
  }

  onSave(): void {
    const margin =
      this.price > 0 ? Math.round(((this.price - this.cost) / this.price) * 100) : 0;
    this.dialogRef.close({
      name: this.name,
      sku: this.sku,
      category: this.category,
      price: this.price,
      cost: this.cost,
      margin: `${margin}%`,
      status: 'Active',
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
export class ProductsComponent {
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

  products: ProductData[] = [
    {
      id: '1',
      name: 'Sourdough Bread',
      sku: 'BRD-001',
      category: 'Bread',
      price: 850,
      cost: 320,
      margin: '62%',
      status: 'Active',
      actions: '',
    },
    {
      id: '2',
      name: 'Croissant',
      sku: 'PST-001',
      category: 'Pastry',
      price: 650,
      cost: 210,
      margin: '68%',
      status: 'Active',
      actions: '',
    },
    {
      id: '3',
      name: 'Napoleon Cake',
      sku: 'CK-001',
      category: 'Cake',
      price: 3200,
      cost: 1100,
      margin: '66%',
      status: 'Active',
      actions: '',
    },
    {
      id: '4',
      name: 'Chocolate Cookie',
      sku: 'CK-002',
      category: 'Cookie',
      price: 350,
      cost: 120,
      margin: '66%',
      status: 'Active',
      actions: '',
    },
    {
      id: '5',
      name: 'Cappuccino',
      sku: 'BEV-001',
      category: 'Beverage',
      price: 900,
      cost: 250,
      margin: '72%',
      status: 'Active',
      actions: '',
    },
    {
      id: '6',
      name: 'Baguette',
      sku: 'BRD-002',
      category: 'Bread',
      price: 550,
      cost: 180,
      margin: '67%',
      status: 'Active',
      actions: '',
    },
    {
      id: '7',
      name: 'Medovik',
      sku: 'CK-003',
      category: 'Cake',
      price: 2800,
      cost: 950,
      margin: '66%',
      status: 'Active',
      actions: '',
    },
    {
      id: '8',
      name: 'Chicken Puff Pastry',
      sku: 'SAV-001',
      category: 'Savory',
      price: 750,
      cost: 310,
      margin: '59%',
      status: 'Active',
      actions: '',
    },
    {
      id: '9',
      name: 'Eclair',
      sku: 'PST-002',
      category: 'Pastry',
      price: 580,
      cost: 190,
      margin: '67%',
      status: 'Inactive',
      actions: '',
    },
    {
      id: '10',
      name: 'Club Sandwich',
      sku: 'SND-001',
      category: 'Sandwich',
      price: 1200,
      cost: 480,
      margin: '60%',
      status: 'Active',
      actions: '',
    },
  ];

  constructor(
    private dialog: MatDialog,
    private confirmService: BakeConfirmationService,
    private toastService: BakeToastService
  ) {}

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '540px',
      data: { mode: 'create' } as ProductDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.products = [
          ...this.products,
          { id: String(this.products.length + 1), ...result, actions: '' },
        ];
        this.toastService.success('Product created successfully');
      }
    });
  }

  openEditDialog(product: ProductData): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '540px',
      data: { mode: 'edit', product } as ProductDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.products = this.products.map((p) =>
          p.id === product.id ? { ...p, ...result } : p
        );
        this.toastService.success('Product updated successfully');
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
            this.products = this.products.filter((p) => p.id !== event.row.id);
            this.toastService.success('Product deleted successfully');
          }
        });
    }
  }
}
