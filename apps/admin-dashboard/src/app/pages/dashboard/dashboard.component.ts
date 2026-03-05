import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BakeStatsCardComponent, BakePageContainerComponent } from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';

interface Alert {
  message: string;
  severity: 'red' | 'amber' | 'green';
  icon: string;
  time: string;
}

interface TopProduct {
  rank: number;
  name: string;
  sold: number;
  revenue: string;
}

interface PlanCategory {
  name: string;
  percentage: number;
  color: string;
}

@Component({
  selector: 'bake-app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    BakeStatsCardComponent,
    BakePageContainerComponent,
  ],
  template: `
    <bake-page-container title="Dashboard" subtitle="Overview of today's operations">
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <bake-stats-card
          title="Revenue"
          [value]="kpis.revenue"
          icon="payments"
          [trend]="kpis.revenueTrend"
          trendLabel="vs last week"
          color="primary"
        ></bake-stats-card>

        <bake-stats-card
          title="Net Profit"
          [value]="kpis.profit"
          icon="account_balance"
          [trend]="kpis.profitTrend"
          trendLabel="vs last week"
          color="accent"
        ></bake-stats-card>

        <bake-stats-card
          title="Orders Today"
          [value]="kpis.orders"
          icon="receipt_long"
          [trend]="kpis.ordersTrend"
          trendLabel="vs yesterday"
          color="primary"
        ></bake-stats-card>

        <bake-stats-card
          title="Avg Check"
          [value]="kpis.avgCheck"
          icon="shopping_cart"
          [trend]="kpis.avgCheckTrend"
          trendLabel="vs last week"
          color="accent"
        ></bake-stats-card>
      </div>

      <!-- Middle Row: Alerts + Top Products -->
      <div class="middle-grid">
        <!-- Alerts Section -->
        <mat-card class="alerts-card">
          <mat-card-header>
            <mat-card-title class="section-title">
              <mat-icon class="section-icon">notifications_active</mat-icon>
              Alerts
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="alerts-list">
              <div
                *ngFor="let alert of alerts"
                class="alert-item"
                [class]="'alert-item alert-item--' + alert.severity"
              >
                <div class="alert-indicator" [class]="'indicator--' + alert.severity"></div>
                <mat-icon class="alert-icon" [class]="'icon--' + alert.severity">
                  {{ alert.icon }}
                </mat-icon>
                <div class="alert-content">
                  <span class="alert-message">{{ alert.message }}</span>
                  <span class="alert-time">{{ alert.time }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Top Products -->
        <mat-card class="top-products-card">
          <mat-card-header>
            <mat-card-title class="section-title">
              <mat-icon class="section-icon">emoji_events</mat-icon>
              Top Products
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list class="products-list">
              <mat-list-item *ngFor="let product of topProducts">
                <div class="product-row">
                  <span class="product-rank">#{{ product.rank }}</span>
                  <span class="product-name">{{ product.name }}</span>
                  <span class="product-sold">{{ product.sold }} sold</span>
                  <span class="product-revenue">{{ product.revenue }}</span>
                </div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Plan Execution -->
      <mat-card class="plan-card">
        <mat-card-header>
          <mat-card-title class="section-title">
            <mat-icon class="section-icon">assignment_turned_in</mat-icon>
            Plan Execution
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="plan-list">
            <div *ngFor="let category of planCategories" class="plan-item">
              <div class="plan-header">
                <span class="plan-name">{{ category.name }}</span>
                <span class="plan-percentage">{{ category.percentage }}%</span>
              </div>
              <mat-progress-bar
                mode="determinate"
                [value]="category.percentage"
                [class]="'plan-bar plan-bar--' + getBarColor(category.percentage)"
              ></mat-progress-bar>
            </div>
          </div>
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

      .middle-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 24px;
      }

      .alerts-card,
      .top-products-card,
      .plan-card {
        border-radius: 12px;
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
        color: #8b4513;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      /* Alerts */
      .alerts-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .alert-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        background-color: #fafafa;
      }

      .alert-indicator {
        width: 4px;
        height: 36px;
        border-radius: 2px;
        flex-shrink: 0;
      }

      .indicator--red {
        background-color: #c62828;
      }

      .indicator--amber {
        background-color: #f57f17;
      }

      .indicator--green {
        background-color: #2e7d32;
      }

      .alert-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .icon--red {
        color: #c62828;
      }

      .icon--amber {
        color: #f57f17;
      }

      .icon--green {
        color: #2e7d32;
      }

      .alert-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .alert-message {
        font-size: 13px;
        font-weight: 500;
        color: #3e2723;
      }

      .alert-time {
        font-size: 11px;
        color: #8d6e63;
      }

      /* Top Products */
      .products-list {
        padding: 0;
      }

      .product-row {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 12px;
        padding: 4px 0;
      }

      .product-rank {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 700;
        color: #8b4513;
        width: 28px;
        flex-shrink: 0;
      }

      .product-name {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        color: #3e2723;
      }

      .product-sold {
        font-size: 12px;
        color: #8d6e63;
        flex-shrink: 0;
      }

      .product-revenue {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        font-weight: 600;
        color: #2e7d32;
        flex-shrink: 0;
      }

      /* Plan Execution */
      .plan-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .plan-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .plan-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .plan-name {
        font-size: 14px;
        font-weight: 500;
        color: #3e2723;
      }

      .plan-percentage {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 700;
        color: #5d4037;
      }

      .plan-bar {
        height: 8px;
        border-radius: 4px;
      }

      ::ng-deep .plan-bar--green .mdc-linear-progress__bar-inner {
        border-color: #2e7d32 !important;
      }

      ::ng-deep .plan-bar--amber .mdc-linear-progress__bar-inner {
        border-color: #f57f17 !important;
      }

      ::ng-deep .plan-bar--red .mdc-linear-progress__bar-inner {
        border-color: #c62828 !important;
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
        .middle-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  kpis = {
    revenue: '$0',
    revenueTrend: 0,
    profit: '$0',
    profitTrend: 0,
    orders: '0',
    ordersTrend: 0,
    avgCheck: '$0',
    avgCheckTrend: 0,
  };

  alerts: Alert[] = [];
  topProducts: TopProduct[] = [];
  planCategories: PlanCategory[] = [];

  constructor(private apiClient: ApiClientService) {}

  ngOnInit(): void {
    this.loadSalesSummary();
    this.loadTopProducts();
    this.loadInventoryAlerts();
    this.loadProductionSummary();
  }

  private loadSalesSummary(): void {
    this.apiClient
      .get<Record<string, number>>('/v1/reports/sales/today')
      .subscribe({
        next: (data) => {
          const revenue = data['totalRevenue'] || 0;
          const orders = data['totalOrders'] || 0;
          const avgCheck = data['avgCheck'] || 0;
          this.kpis.revenue = `$${revenue.toLocaleString()}`;
          this.kpis.revenueTrend = data['revenueTrend'] || 0;
          this.kpis.orders = String(orders);
          this.kpis.ordersTrend = data['ordersTrend'] || 0;
          this.kpis.avgCheck = `$${avgCheck.toLocaleString()}`;
        },
      });

    this.apiClient
      .get<Record<string, number>>('/v1/reports/finance/summary')
      .subscribe({
        next: (data) => {
          const profit = data['netProfit'] || 0;
          this.kpis.profit = `$${profit.toLocaleString()}`;
        },
      });
  }

  private loadTopProducts(): void {
    this.apiClient
      .get<Array<Record<string, unknown>>>('/v1/reports/sales/top-products')
      .subscribe({
        next: (data) => {
          this.topProducts = data.slice(0, 5).map((p, i) => ({
            rank: i + 1,
            name: String(p['productName'] || p['name'] || ''),
            sold: Number(p['quantity'] || p['sold'] || 0),
            revenue: `$${Number(p['revenue'] || 0).toLocaleString()}`,
          }));
        },
      });
  }

  private loadInventoryAlerts(): void {
    this.apiClient
      .get<Record<string, unknown>>('/v1/reports/inventory/status')
      .subscribe({
        next: (data) => {
          const lowStock = (data['lowStockItems'] as Array<Record<string, unknown>>) || [];
          this.alerts = lowStock.slice(0, 5).map((item) => ({
            message: `${item['ingredientName'] || 'Item'} stock low (${item['quantity'] || 0} ${item['unit'] || ''} remaining)`,
            severity: 'red' as const,
            icon: 'error',
            time: this.getRelativeTime(item['createdAt'] as string),
          }));
        },
      });
  }

  private getRelativeTime(dateStr: string | undefined): string {
    if (!dateStr) return 'Recently';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  private loadProductionSummary(): void {
    this.apiClient
      .get<Record<string, unknown>>('/v1/reports/production/summary')
      .subscribe({
        next: (data) => {
          const byRecipe =
            (data['byRecipe'] as Array<Record<string, unknown>>) || [];
          this.planCategories = byRecipe.map((r) => {
            const planned = Number(r['totalPlanned'] || 0);
            const yielded = Number(r['totalYield'] || 0);
            const pct = planned > 0 ? Math.round((yielded / planned) * 100) : 0;
            return {
              name: String(r['recipeName'] || ''),
              percentage: pct,
              color: this.getBarColor(pct),
            };
          });
        },
      });
  }

  getBarColor(percentage: number): string {
    if (percentage >= 85) return 'green';
    if (percentage >= 70) return 'amber';
    return 'red';
  }
}
