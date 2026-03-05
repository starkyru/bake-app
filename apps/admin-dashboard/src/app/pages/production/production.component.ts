import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import {
  BakeDataTableComponent,
  BakePageContainerComponent,
  BakeStatsCardComponent,
  TableColumn,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { ProductionPlan, ProductionTask } from '@bake-app/shared-types';

interface ProductionItem {
  time: string;
  recipe: string;
  category: string;
  planned: number;
  completed: number;
  status: string;
  assigned: string;
}

interface IngredientRequirement {
  ingredient: string;
  required: number;
  available: number;
  unit: string;
  status: string;
}

@Component({
  selector: 'bake-app-production',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    BakeDataTableComponent,
    BakePageContainerComponent,
    BakeStatsCardComponent,
  ],
  template: `
    <bake-page-container title="Production" subtitle="Daily production plan and ingredient requirements">
      <!-- Production KPIs -->
      <div class="kpi-grid">
        <bake-stats-card
          title="Planned Items"
          [value]="kpis.planned"
          icon="assignment"
          color="primary"
        ></bake-stats-card>

        <bake-stats-card
          title="Completed"
          [value]="kpis.completed"
          icon="check_circle"
          [trend]="kpis.completionPct"
          trendLabel="% done"
          color="accent"
        ></bake-stats-card>

        <bake-stats-card
          title="In Progress"
          [value]="kpis.inProgress"
          icon="pending"
          color="primary"
        ></bake-stats-card>

        <bake-stats-card
          title="Behind Schedule"
          [value]="kpis.behindSchedule"
          icon="warning"
          color="warn"
        ></bake-stats-card>
      </div>

      <!-- Production Plan Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title class="section-title">
            <mat-icon class="section-icon">schedule</mat-icon>
            Daily Production Plan
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <bake-data-table
            [columns]="productionColumns"
            [data]="productionData"
            [searchable]="true"
          ></bake-data-table>
        </mat-card-content>
      </mat-card>

      <!-- Ingredient Requirements Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title class="section-title">
            <mat-icon class="section-icon">kitchen</mat-icon>
            Ingredient Requirements
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <bake-data-table
            [columns]="ingredientColumns"
            [data]="ingredientData"
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

      .table-card:last-child {
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
        color: #8b4513;
        font-size: 22px;
        width: 22px;
        height: 22px;
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
export class ProductionComponent implements OnInit {
  kpis = {
    planned: '0',
    completed: '0',
    completionPct: 0,
    inProgress: '0',
    behindSchedule: '0',
  };

  productionColumns: TableColumn[] = [
    { key: 'time', label: 'Time', type: 'text', width: '90px' },
    { key: 'recipe', label: 'Recipe', type: 'text' },
    { key: 'category', label: 'Category', type: 'text', width: '110px' },
    { key: 'planned', label: 'Planned Qty', type: 'number', width: '110px' },
    { key: 'completed', label: 'Completed', type: 'number', width: '100px' },
    { key: 'status', label: 'Status', type: 'badge', width: '130px' },
    { key: 'assigned', label: 'Assigned', type: 'text', width: '120px' },
  ];

  productionData: ProductionItem[] = [];

  ingredientColumns: TableColumn[] = [
    { key: 'ingredient', label: 'Ingredient', type: 'text' },
    { key: 'required', label: 'Required', type: 'number', width: '100px' },
    { key: 'available', label: 'Available', type: 'number', width: '100px' },
    { key: 'unit', label: 'Unit', type: 'text', width: '80px' },
    { key: 'status', label: 'Status', type: 'badge', width: '130px' },
  ];

  ingredientData: IngredientRequirement[] = [];

  constructor(private apiClient: ApiClientService) {}

  ngOnInit(): void {
    this.loadProductionPlans();
    this.loadIngredientRequirements();
  }

  private loadProductionPlans(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    this.apiClient
      .get<ProductionPlan[]>(`/v1/production/plans?date=${todayStr}`)
      .subscribe({
        next: (plans) => {
          const items: ProductionItem[] = [];
          for (const plan of plans) {
            for (const task of plan.tasks) {
              items.push(this.mapTask(task));
            }
          }
          this.productionData = items;
          this.updateKpis(items);
        },
      });
  }

  private mapTask(task: ProductionTask): ProductionItem {
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      delayed: 'Delayed',
    };
    const time = task.scheduledStart
      ? new Date(task.scheduledStart).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '--:--';
    return {
      time,
      recipe: task.recipeName || 'Recipe',
      category: '',
      planned: task.plannedQuantity,
      completed: task.actualYield || 0,
      status: statusMap[task.status] || 'Pending',
      assigned: task.assigneeName || '',
    };
  }

  private updateKpis(items: ProductionItem[]): void {
    const totalPlanned = items.reduce((s, i) => s + i.planned, 0);
    const totalCompleted = items.reduce((s, i) => s + i.completed, 0);
    const inProgress = items.filter((i) => i.status === 'In Progress').length;
    const delayed = items.filter((i) => i.status === 'Delayed').length;
    const pct = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;
    this.kpis = {
      planned: String(totalPlanned),
      completed: String(totalCompleted),
      completionPct: pct,
      inProgress: String(inProgress),
      behindSchedule: String(delayed),
    };
  }

  private loadIngredientRequirements(): void {
    this.apiClient
      .get<Record<string, unknown>>('/v1/reports/inventory/status')
      .subscribe({
        next: (data) => {
          const stockLevels =
            (data['stockLevels'] as Array<Record<string, unknown>>) || [];
          this.ingredientData = stockLevels.map((item) => {
            const available = Number(item['quantity'] || 0);
            const minLevel = Number(item['minStockLevel'] || 0);
            let status = 'In Stock';
            if (available <= 0) {
              status = 'Out of Stock';
            } else if (available <= minLevel) {
              status = 'Low Stock';
            }
            return {
              ingredient: String(item['ingredientName'] || ''),
              required: minLevel,
              available,
              unit: String(item['unit'] || ''),
              status,
            };
          });
        },
      });
  }
}
