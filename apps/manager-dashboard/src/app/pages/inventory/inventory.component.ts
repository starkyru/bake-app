import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  BakeDataTableComponent,
  BakePageContainerComponent,
  TableColumn,
} from '@bake-app/ui-components';

interface InventoryItem {
  ingredient: string;
  category: string;
  quantity: number;
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
    BakeDataTableComponent,
    BakePageContainerComponent,
  ],
  template: `
    <bake-page-container title="Inventory" subtitle="Stock levels and ingredient management">
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
export class InventoryComponent {
  columns: TableColumn[] = [
    { key: 'ingredient', label: 'Ingredient', type: 'text' },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'quantity', label: 'Qty', type: 'number', width: '80px' },
    { key: 'unit', label: 'Unit', type: 'text', width: '80px' },
    { key: 'minLevel', label: 'Min Level', type: 'number', width: '100px' },
    { key: 'status', label: 'Status', type: 'badge', width: '120px' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '100px', sortable: false },
  ];

  inventoryData: InventoryItem[] = [
    { ingredient: 'Wheat Flour', category: 'Flour', quantity: 5, unit: 'kg', minLevel: 20, status: 'Low Stock' },
    { ingredient: 'Sugar', category: 'Sweetener', quantity: 25, unit: 'kg', minLevel: 10, status: 'In Stock' },
    { ingredient: 'Butter', category: 'Dairy', quantity: 8, unit: 'kg', minLevel: 5, status: 'In Stock' },
    { ingredient: 'Whole Milk', category: 'Dairy', quantity: 12, unit: 'L', minLevel: 10, status: 'In Stock' },
    { ingredient: 'Eggs', category: 'Dairy', quantity: 60, unit: 'pcs', minLevel: 30, status: 'In Stock' },
    { ingredient: 'Coffee Beans', category: 'Beverages', quantity: 3, unit: 'kg', minLevel: 5, status: 'Low Stock' },
    { ingredient: 'Dark Chocolate', category: 'Confectionery', quantity: 0, unit: 'kg', minLevel: 3, status: 'Out of Stock' },
    { ingredient: 'Vanilla Extract', category: 'Flavoring', quantity: 0.5, unit: 'L', minLevel: 0.3, status: 'In Stock' },
    { ingredient: 'Dry Yeast', category: 'Leavening', quantity: 2, unit: 'kg', minLevel: 1, status: 'In Stock' },
    { ingredient: 'Heavy Cream', category: 'Dairy', quantity: 4, unit: 'L', minLevel: 5, status: 'Low Stock' },
    { ingredient: 'Almonds', category: 'Nuts', quantity: 6, unit: 'kg', minLevel: 3, status: 'In Stock' },
    { ingredient: 'Fresh Berries', category: 'Fruits', quantity: 0, unit: 'kg', minLevel: 2, status: 'Out of Stock' },
    { ingredient: 'Rye Flour', category: 'Flour', quantity: 15, unit: 'kg', minLevel: 10, status: 'In Stock' },
    { ingredient: 'Powdered Sugar', category: 'Sweetener', quantity: 8, unit: 'kg', minLevel: 5, status: 'In Stock' },
  ];

  get lowStockCount(): number {
    return this.inventoryData.filter((i) => i.status === 'Low Stock').length;
  }

  get outOfStockCount(): number {
    return this.inventoryData.filter((i) => i.status === 'Out of Stock').length;
  }

  get inStockCount(): number {
    return this.inventoryData.filter((i) => i.status === 'In Stock').length;
  }

  onRowAction(event: { action: string; row: any }): void {
    console.log('Row action:', event.action, event.row);
  }
}
