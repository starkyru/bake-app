import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  BakeDataTableComponent,
  BakePageContainerComponent,
  BakeStatsCardComponent,
  TableColumn,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';

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
          [value]="kpis.totalSales"
          icon="point_of_sale"
          [trend]="0"
          trendLabel="vs yesterday"
          color="primary"
        ></bake-stats-card>

        <bake-stats-card
          title="Items Sold"
          [value]="kpis.itemsSold"
          icon="shopping_basket"
          [trend]="0"
          trendLabel="vs yesterday"
          color="accent"
        ></bake-stats-card>

        <bake-stats-card
          title="Avg Check"
          [value]="kpis.avgCheck"
          icon="receipt"
          [trend]="0"
          trendLabel="vs last week"
          color="primary"
        ></bake-stats-card>

        <bake-stats-card
          title="Orders"
          [value]="kpis.orders"
          icon="receipt_long"
          [trend]="0"
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
export class SalesComponent implements OnInit {
  kpis = {
    totalSales: '$0',
    itemsSold: '0',
    avgCheck: '$0',
    orders: '0',
  };

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

  topProducts: SalesItem[] = [];
  bottomProducts: SalesItem[] = [];

  constructor(private apiClient: ApiClientService) {}

  ngOnInit(): void {
    this.loadSalesSummary();
    this.loadTopProducts();
  }

  private loadSalesSummary(): void {
    this.apiClient
      .get<Array<Record<string, unknown>>>('/v1/reports/sales/summary?period=daily')
      .subscribe({
        next: (rows) => {
          let totalRevenue = 0;
          let totalOrders = 0;
          let totalItems = 0;
          for (const row of rows) {
            totalRevenue += Number(row['revenue'] || 0);
            totalOrders += Number(row['orderCount'] || 0);
          }
          const avgCheck = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
          this.kpis.totalSales = `$${totalRevenue.toLocaleString()}`;
          this.kpis.orders = String(totalOrders);
          this.kpis.avgCheck = `$${avgCheck.toLocaleString()}`;
          this.kpis.itemsSold = String(totalOrders);
        },
      });
  }

  private loadTopProducts(): void {
    this.apiClient
      .get<Array<Record<string, unknown>>>('/v1/reports/sales/top-products')
      .subscribe({
        next: (data) => {
          const items: SalesItem[] = data.map((p, i) => ({
            rank: i + 1,
            product: String(p['productName'] || ''),
            category: String(p['categoryName'] || ''),
            qtySold: Number(p['totalQuantity'] || 0),
            revenue: Number(p['totalRevenue'] || 0),
            trend: 'Active',
          }));
          this.topProducts = items.slice(0, 10);
          this.bottomProducts = items.length > 10
            ? items.slice(-5).map((item, i) => ({ ...item, rank: i + 1, trend: 'Pending' }))
            : [];
        },
      });
  }
}
