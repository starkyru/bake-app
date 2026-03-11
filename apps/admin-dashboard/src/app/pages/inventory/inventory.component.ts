import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  BakeDataTableComponent,
  BakePageContainerComponent,
  BakeToastService,
  TableColumn,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { Ingredient } from '@bake-app/shared-types';
import {
  AddInventoryDialogComponent,
  AddInventoryDialogResult,
} from './add-inventory-dialog.component';

interface InventoryRow {
  title: string;
  ingredient: string;
  category: string;
  packages: string;
  quantity: string;
  unit: string;
  minLevel: number;
  status: string;
}

@Component({
  selector: 'bake-app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    BakeDataTableComponent,
    BakePageContainerComponent,
  ],
  template: `
    <bake-page-container title="Inventory" subtitle="Stock levels and ingredient management">
      <div class="page-actions">
        <button mat-flat-button class="add-btn" (click)="openAddDialog()">
          <mat-icon>add</mat-icon>
          Add Inventory
        </button>
      </div>

      <!-- Low Stock Alert Banner -->
      <div class="alert-banner" *ngIf="lowStockCount > 0">
        <mat-icon class="alert-banner-icon">warning</mat-icon>
        <div class="alert-banner-content">
          <span class="alert-banner-title">Low Stock Alert</span>
          <span class="alert-banner-message">
            {{ lowStockCount }} ingredient{{ lowStockCount > 1 ? 's' : '' }}
            {{ lowStockCount > 1 ? 'are' : 'is' }} below minimum level.
            {{ outOfStockCount }} item{{ outOfStockCount > 1 ? 's' : '' }} out of stock.
          </span>
        </div>
        <button mat-flat-button class="alert-banner-btn">
          <mat-icon>shopping_cart</mat-icon>
          Create Order
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <mat-card class="summary-card">
          <mat-card-content>
            <div class="summary-item">
              <mat-icon class="summary-icon icon-total">inventory_2</mat-icon>
              <div class="summary-details">
                <span class="summary-value">{{ inventoryData.length }}</span>
                <span class="summary-label">Total Items</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="summary-card">
          <mat-card-content>
            <div class="summary-item">
              <mat-icon class="summary-icon icon-ok">check_circle</mat-icon>
              <div class="summary-details">
                <span class="summary-value">{{ inStockCount }}</span>
                <span class="summary-label">In Stock</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="summary-card">
          <mat-card-content>
            <div class="summary-item">
              <mat-icon class="summary-icon icon-low">warning</mat-icon>
              <div class="summary-details">
                <span class="summary-value">{{ lowStockCount }}</span>
                <span class="summary-label">Low Stock</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="summary-card">
          <mat-card-content>
            <div class="summary-item">
              <mat-icon class="summary-icon icon-out">error</mat-icon>
              <div class="summary-details">
                <span class="summary-value">{{ outOfStockCount }}</span>
                <span class="summary-label">Out of Stock</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Inventory Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <bake-data-table
            [columns]="columns"
            [data]="inventoryData"
            [loading]="loading"
            [searchable]="true"
            (rowAction)="onRowAction($event)"
          ></bake-data-table>
        </mat-card-content>
      </mat-card>
    </bake-page-container>
  `,
  styles: [
    `
      .alert-banner {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        background-color: #fff8e1;
        border: 1px solid #ffe082;
        border-radius: 12px;
        margin-bottom: 24px;
      }

      .alert-banner-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #f57f17;
        flex-shrink: 0;
      }

      .alert-banner-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
      }

      .alert-banner-title {
        font-size: 14px;
        font-weight: 600;
        color: #e65100;
      }

      .alert-banner-message {
        font-size: 13px;
        color: #5d4037;
      }

      .alert-banner-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
        border-radius: 8px;
        flex-shrink: 0;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .summary-card {
        border-radius: 12px;
      }

      .summary-item {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .summary-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .icon-total {
        color: #8b4513;
      }

      .icon-ok {
        color: #2e7d32;
      }

      .icon-low {
        color: #f57f17;
      }

      .icon-out {
        color: #c62828;
      }

      .summary-details {
        display: flex;
        flex-direction: column;
      }

      .summary-value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 24px;
        font-weight: 700;
        color: #263238;
      }

      .summary-label {
        font-size: 12px;
        color: #78909c;
        font-weight: 500;
      }

      .page-actions {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 16px;
      }

      .add-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
        border-radius: 8px;
      }

      .table-card {
        border-radius: 12px;
      }

      @media (max-width: 900px) {
        .summary-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 600px) {
        .alert-banner {
          flex-direction: column;
          text-align: center;
        }
        .summary-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class InventoryComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'ingredient', label: 'Ingredient', type: 'text' },
    { key: 'category', label: 'Category', type: 'badge', sortable: true },
    { key: 'packages', label: 'Packages', type: 'text', width: '160px' },
    { key: 'quantity', label: 'Qty', type: 'text', width: '120px' },
    { key: 'unit', label: 'Unit', type: 'text', width: '80px' },
    { key: 'minLevel', label: 'Min Level', type: 'number', width: '100px' },
    { key: 'status', label: 'Status', type: 'badge', width: '120px' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '100px', sortable: false },
  ];

  inventoryData: InventoryRow[] = [];
  loading = false;

  private ingredients: Ingredient[] = [];

  constructor(
    private apiClient: ApiClientService,
    private dialog: MatDialog,
    private toastService: BakeToastService,
  ) {}

  ngOnInit(): void {
    this.loadInventory();
    this.loadIngredients();
  }

  private loadIngredients(): void {
    this.apiClient
      .get<{ data: Ingredient[] }>('/v1/ingredients?limit=100')
      .subscribe({
        next: (res) => (this.ingredients = res.data),
        error: () => {},
      });
  }

  private loadInventory(): void {
    this.loading = true;
    this.apiClient
      .get<any[]>('/v1/inventory')
      .subscribe({
        next: (items) => {
          this.inventoryData = items.map((item) => {
            const qty = Number(item.quantity || 0);
            const minLevel = Number(item.ingredient?.minStockLevel || 0);
            let status = 'In Stock';
            if (qty <= 0) {
              status = 'Out of Stock';
            } else if (minLevel > 0 && qty <= minLevel) {
              status = 'Low Stock';
            }

            // Build packages summary
            const pkgSummary = (item.packages || [])
              .map((p: any) => `${p.size}${p.unit}`)
              .join(', ');

            // Build quantity display with metric equivalent
            const ingredientUnit = item.ingredient?.unit || '';
            let qtyDisplay = `${qty} ${ingredientUnit}`;
            if (item.metricQuantity && item.metricUnit) {
              qtyDisplay += ` (${item.metricQuantity} ${item.metricUnit})`;
            }

            return {
              title: item.title || '',
              ingredient: item.ingredient?.name || '',
              category: item.ingredient?.ingredientCategory?.name || '',
              packages: pkgSummary,
              quantity: qtyDisplay,
              unit: ingredientUnit,
              minLevel,
              status,
            };
          });
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  get lowStockCount(): number {
    return this.inventoryData.filter((i) => i.status === 'Low Stock').length;
  }

  get outOfStockCount(): number {
    return this.inventoryData.filter((i) => i.status === 'Out of Stock').length;
  }

  get inStockCount(): number {
    return this.inventoryData.filter((i) => i.status === 'In Stock').length;
  }

  openAddDialog(): void {
    const ref = this.dialog.open(AddInventoryDialogComponent, {
      data: { ingredients: this.ingredients },
      width: '500px',
    });
    ref.afterClosed().subscribe((result: AddInventoryDialogResult | undefined) => {
      if (result) {
        this.apiClient.post('/v1/inventory', result).subscribe({
          next: () => {
            this.toastService.success('Inventory added successfully');
            this.loadInventory();
          },
          error: () => this.toastService.error('Failed to add inventory'),
        });
      }
    });
  }

  onRowAction(event: { action: string; row: unknown }): void {
    console.log('Row action:', event.action, event.row);
  }
}
