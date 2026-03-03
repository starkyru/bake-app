import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  BakeDataTableComponent,
  BakePageContainerComponent,
  BakeStatsCardComponent,
  TableColumn,
} from '@bake-app/ui-components';

interface SalesItem {
  rank: number;
  product: string;
  category: string;
  qtySold: number;
  revenue: number;
  trend: string;
}

@Component({
  selector: 'bake-app-sales',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    BakeDataTableComponent,
    BakePageContainerComponent,
    BakeStatsCardComponent,
  ],
  template: `
    <bake-page-container title="Sales" subtitle="Product performance and sales analytics">
      <!-- Sales KPI Cards -->
      <div class="kpi-grid">
        <bake-stats-card
          title="Total Sales"
          value="$1,245,000"
          icon="point_of_sale"
          [trend]="12.5"
          trendLabel="vs yesterday"
          color="primary"
        ></bake-stats-card>

        <bake-stats-card
          title="Items Sold"
          value="342"
          icon="shopping_basket"
          [trend]="5.8"
          trendLabel="vs yesterday"
          color="accent"
        ></bake-stats-card>

        <bake-stats-card
          title="Avg Check"
          value="$7,980"
          icon="receipt"
          [trend]="5.1"
          trendLabel="vs last week"
          color="primary"
        ></bake-stats-card>

        <bake-stats-card
          title="Orders"
          value="156"
          icon="receipt_long"
          [trend]="-3.2"
          trendLabel="vs yesterday"
          color="warn"
        ></bake-stats-card>
      </div>

      <!-- Top Products Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title class="section-title">
            <mat-icon class="section-icon">trending_up</mat-icon>
            Top Performing Products
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <bake-data-table
            [columns]="topColumns"
            [data]="topProducts"
            [searchable]="true"
          ></bake-data-table>
        </mat-card-content>
      </mat-card>

      <!-- Bottom Products Table -->
      <mat-card class="table-card bottom-table">
        <mat-card-header>
          <mat-card-title class="section-title">
            <mat-icon class="section-icon section-icon--warn">trending_down</mat-icon>
            Underperforming Products
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <bake-data-table
            [columns]="bottomColumns"
            [data]="bottomProducts"
            [searchable]="false"
          ></bake-data-table>
        </mat-card-content>
      </mat-card>
    </bake-page-container>
  `,
  styles: [
    `
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 24px;
      }

      .table-card {
        border-radius: 12px;
        margin-bottom: 24px;
      }

      .bottom-table {
        margin-bottom: 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #3e2723;
      }

      .section-icon {
        color: #2e7d32;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .section-icon--warn {
        color: #c62828;
      }

      @media (max-width: 1200px) {
        .kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 768px) {
        .kpi-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SalesComponent {
  topColumns: TableColumn[] = [
    { key: 'rank', label: '#', type: 'number', width: '60px' },
    { key: 'product', label: 'Product', type: 'text' },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'qtySold', label: 'Qty Sold', type: 'number', width: '100px' },
    { key: 'revenue', label: 'Revenue', type: 'currency' },
    { key: 'trend', label: 'Trend', type: 'badge', width: '100px' },
  ];

  bottomColumns: TableColumn[] = [
    { key: 'rank', label: '#', type: 'number', width: '60px' },
    { key: 'product', label: 'Product', type: 'text' },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'qtySold', label: 'Qty Sold', type: 'number', width: '100px' },
    { key: 'revenue', label: 'Revenue', type: 'currency' },
    { key: 'trend', label: 'Trend', type: 'badge', width: '100px' },
  ];

  topProducts: SalesItem[] = [
    { rank: 1, product: 'Sourdough Bread', category: 'Bread', qtySold: 42, revenue: 126000, trend: 'Active' },
    { rank: 2, product: 'Croissant', category: 'Pastries', qtySold: 38, revenue: 76000, trend: 'Active' },
    { rank: 3, product: 'Napoleon Cake', category: 'Cakes', qtySold: 15, revenue: 112500, trend: 'Active' },
    { rank: 4, product: 'Cappuccino', category: 'Coffee', qtySold: 65, revenue: 58500, trend: 'Active' },
    { rank: 5, product: 'Eclair', category: 'Pastries', qtySold: 28, revenue: 47600, trend: 'Active' },
    { rank: 6, product: 'Baguette', category: 'Bread', qtySold: 35, revenue: 42000, trend: 'Active' },
    { rank: 7, product: 'Americano', category: 'Coffee', qtySold: 52, revenue: 41600, trend: 'Active' },
    { rank: 8, product: 'Cheesecake', category: 'Cakes', qtySold: 12, revenue: 48000, trend: 'Active' },
    { rank: 9, product: 'Cinnamon Roll', category: 'Pastries', qtySold: 25, revenue: 37500, trend: 'Active' },
    { rank: 10, product: 'Latte', category: 'Coffee', qtySold: 45, revenue: 36000, trend: 'Active' },
  ];

  bottomProducts: SalesItem[] = [
    { rank: 1, product: 'Rye Bread', category: 'Bread', qtySold: 3, revenue: 4500, trend: 'Low Stock' },
    { rank: 2, product: 'Fruit Tart', category: 'Pastries', qtySold: 2, revenue: 5000, trend: 'Low Stock' },
    { rank: 3, product: 'Matcha Latte', category: 'Coffee', qtySold: 4, revenue: 4800, trend: 'Pending' },
    { rank: 4, product: 'Macaron Set', category: 'Pastries', qtySold: 1, revenue: 3500, trend: 'Low Stock' },
    { rank: 5, product: 'Herbal Tea', category: 'Beverages', qtySold: 5, revenue: 3000, trend: 'Pending' },
  ];
}
