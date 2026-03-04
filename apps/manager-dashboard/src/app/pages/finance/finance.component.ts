import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import {
  BakeStatsCardComponent,
  BakePageContainerComponent,
  BakeDataTableComponent,
  TableColumn,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';

interface CostItem {
  category: string;
  amount: number;
  percentage: number;
}

interface FoodCostItem {
  category: string;
  revenue: number;
  cost: number;
  foodCost: number;
  margin: number;
}

@Component({
  selector: 'bake-app-finance',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    BakeStatsCardComponent,
    BakePageContainerComponent,
    BakeDataTableComponent,
  ],
  template: `
    <bake-page-container title="Finance" subtitle="Revenue, costs, and profitability">
      <!-- Revenue Summary Cards -->
      <div class="kpi-grid">
        <bake-stats-card
          title="Daily Revenue"
          [value]="kpis.revenue"
          icon="payments"
          [trend]="0"
          trendLabel="vs yesterday"
          color="primary"
        ></bake-stats-card>

        <bake-stats-card
          title="Total Costs"
          [value]="kpis.totalCosts"
          icon="receipt"
          [trend]="0"
          trendLabel="vs yesterday"
          color="warn"
        ></bake-stats-card>

        <bake-stats-card
          title="Net Profit"
          [value]="kpis.netProfit"
          icon="account_balance"
          [trend]="0"
          trendLabel="vs yesterday"
          color="accent"
        ></bake-stats-card>

        <bake-stats-card
          title="Profit Margin"
          [value]="kpis.margin"
          icon="trending_up"
          [trend]="0"
          trendLabel="vs last week"
          color="primary"
        ></bake-stats-card>
      </div>

      <div class="finance-grid">
        <!-- Cost Breakdown -->
        <mat-card class="cost-card">
          <mat-card-header>
            <mat-card-title class="section-title">
              <mat-icon class="section-icon">pie_chart</mat-icon>
              Cost Breakdown
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="cost-list">
              <div *ngFor="let item of costBreakdown" class="cost-item">
                <div class="cost-info">
                  <span class="cost-category">{{ item.category }}</span>
                  <span class="cost-percentage">{{ item.percentage }}%</span>
                </div>
                <div class="cost-bar-track">
                  <div
                    class="cost-bar-fill"
                    [style.width.%]="item.percentage"
                    [style.background-color]="getBarColor(item.category)"
                  ></div>
                </div>
                <span class="cost-amount">${{ item.amount | number }}</span>
              </div>
            </div>

            <mat-divider class="section-divider"></mat-divider>

            <div class="cost-total">
              <span class="total-label">Total Costs</span>
              <span class="total-amount">{{ kpis.totalCosts }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Revenue by Period -->
        <mat-card class="revenue-card">
          <mat-card-header>
            <mat-card-title class="section-title">
              <mat-icon class="section-icon">calendar_today</mat-icon>
              Revenue Summary
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="revenue-list">
              <div *ngFor="let period of revenuePeriods" class="revenue-item">
                <div class="revenue-period">
                  <mat-icon class="period-icon">{{ period.icon }}</mat-icon>
                  <span class="period-label">{{ period.label }}</span>
                </div>
                <div class="revenue-values">
                  <span class="revenue-amount">${{ period.revenue | number }}</span>
                  <span
                    class="revenue-change"
                    [class.positive]="period.change >= 0"
                    [class.negative]="period.change < 0"
                  >
                    {{ period.change >= 0 ? '+' : '' }}{{ period.change }}%
                  </span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Food Cost by Category Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title class="section-title">
            <mat-icon class="section-icon">restaurant</mat-icon>
            Food Cost by Category
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <bake-data-table
            [columns]="foodCostColumns"
            [data]="foodCostData"
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

      .finance-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 24px;
      }

      .cost-card,
      .revenue-card,
      .table-card {
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

      /* Cost Breakdown */
      .cost-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .cost-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .cost-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .cost-category {
        font-size: 13px;
        font-weight: 500;
        color: #3e2723;
      }

      .cost-percentage {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        font-weight: 600;
        color: #78909c;
      }

      .cost-bar-track {
        width: 100%;
        height: 6px;
        background-color: #f5f5f5;
        border-radius: 3px;
        overflow: hidden;
      }

      .cost-bar-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s ease;
      }

      .cost-amount {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        font-weight: 600;
        color: #5d4037;
      }

      .section-divider {
        margin: 20px 0;
      }

      .cost-total {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .total-label {
        font-size: 14px;
        font-weight: 600;
        color: #3e2723;
      }

      .total-amount {
        font-family: 'JetBrains Mono', monospace;
        font-size: 18px;
        font-weight: 700;
        color: #c62828;
      }

      /* Revenue Summary */
      .revenue-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .revenue-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border-radius: 8px;
        transition: background-color 0.2s;
      }

      .revenue-item:hover {
        background-color: #faf3e8;
      }

      .revenue-period {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .period-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #8b4513;
      }

      .period-label {
        font-size: 14px;
        font-weight: 500;
        color: #3e2723;
      }

      .revenue-values {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .revenue-amount {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 600;
        color: #263238;
      }

      .revenue-change {
        font-family: 'JetBrains Mono', monospace;
        font-size: 12px;
        font-weight: 600;
        min-width: 48px;
        text-align: right;
      }

      .revenue-change.positive {
        color: #2e7d32;
      }

      .revenue-change.negative {
        color: #c62828;
      }

      .table-card {
        margin-top: 0;
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
        .finance-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class FinanceComponent implements OnInit {
  kpis = {
    revenue: '$0',
    totalCosts: '$0',
    netProfit: '$0',
    margin: '0%',
  };

  costBreakdown: CostItem[] = [];

  revenuePeriods: Array<{ label: string; revenue: number; change: number; icon: string }> = [];

  foodCostColumns: TableColumn[] = [
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'revenue', label: 'Revenue', type: 'currency' },
    { key: 'cost', label: 'Cost', type: 'currency' },
    { key: 'foodCost', label: 'Food Cost %', type: 'text' },
    { key: 'margin', label: 'Margin %', type: 'text' },
  ];

  foodCostData: FoodCostItem[] = [];

  constructor(private apiClient: ApiClientService) {}

  ngOnInit(): void {
    this.loadFinanceSummary();
    this.loadSalesByCategory();
  }

  private loadFinanceSummary(): void {
    this.apiClient
      .get<Record<string, unknown>>('/v1/reports/finance/summary')
      .subscribe({
        next: (data) => {
          const totalRevenue = Number(data['totalRevenue'] || 0);
          const totalExpenses = Number(data['totalExpenses'] || 0);
          const netProfit = Number(data['netProfit'] || 0);
          const margin = Number(data['margin'] || 0);

          this.kpis = {
            revenue: `$${totalRevenue.toLocaleString()}`,
            totalCosts: `$${totalExpenses.toLocaleString()}`,
            netProfit: `$${netProfit.toLocaleString()}`,
            margin: `${margin}%`,
          };

          const breakdown =
            (data['breakdown'] as Array<Record<string, unknown>>) || [];
          const expenseRows = breakdown.filter((r) => r['type'] === 'expense');
          const expenseTotal = expenseRows.reduce(
            (sum, r) => sum + Math.abs(Number(r['total'] || 0)),
            0,
          );
          this.costBreakdown = expenseRows.map((r) => {
            const amount = Math.abs(Number(r['total'] || 0));
            return {
              category: String(r['category'] || 'Other'),
              amount,
              percentage:
                expenseTotal > 0 ? Math.round((amount / expenseTotal) * 100) : 0,
            };
          });

          const revenueRows = breakdown.filter((r) => r['type'] === 'revenue');
          this.revenuePeriods = [
            {
              label: 'Total Revenue',
              revenue: totalRevenue,
              change: 0,
              icon: 'today',
            },
            ...revenueRows.slice(0, 4).map((r) => ({
              label: String(r['category'] || ''),
              revenue: Number(r['total'] || 0),
              change: 0,
              icon: 'receipt',
            })),
          ];
        },
      });
  }

  private loadSalesByCategory(): void {
    this.apiClient
      .get<Array<Record<string, unknown>>>('/v1/reports/sales/by-category')
      .subscribe({
        next: (data) => {
          this.foodCostData = data.map((row) => {
            const revenue = Number(row['totalRevenue'] || 0);
            const cost = Math.round(revenue * 0.35);
            const foodCostPct = revenue > 0 ? Math.round((cost / revenue) * 100) : 0;
            return {
              category: String(row['categoryName'] || ''),
              revenue,
              cost,
              foodCost: foodCostPct,
              margin: 100 - foodCostPct,
            };
          });
        },
      });
  }

  getBarColor(category: string): string {
    const colors: Record<string, string> = {
      Ingredients: '#8b4513',
      Labor: '#d4a574',
      'Rent & Utilities': '#2e7d32',
      Packaging: '#1976d2',
      Marketing: '#f57f17',
      Other: '#78909c',
    };
    return colors[category] || '#78909c';
  }
}
