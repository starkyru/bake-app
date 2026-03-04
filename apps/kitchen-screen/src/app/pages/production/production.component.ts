import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiClientService } from '@bake-app/api-client';
import { ProductionPlan, ProductionTask } from '@bake-app/shared-types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type ProductionStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Delayed';

interface ProductionItem {
  id: string;
  time: string;
  recipe: string;
  plannedQty: number;
  actualQty: number;
  status: ProductionStatus;
  progress: number;
  notes?: string;
}

@Component({
  selector: 'bake-app-production',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <div class="production-container">
      <div class="production-header">
        <div class="header-left">
          <h1 class="page-title">Daily Production Schedule</h1>
          <span class="page-date">{{ today }}</span>
        </div>
        <div class="header-stats">
          <div class="stat-pill stat-pill--completed">
            <mat-icon>check_circle</mat-icon>
            <span class="stat-value">{{ completedCount }}</span>
            <span class="stat-label">Done</span>
          </div>
          <div class="stat-pill stat-pill--progress">
            <mat-icon>autorenew</mat-icon>
            <span class="stat-value">{{ inProgressCount }}</span>
            <span class="stat-label">Active</span>
          </div>
          <div class="stat-pill stat-pill--scheduled">
            <mat-icon>schedule</mat-icon>
            <span class="stat-value">{{ scheduledCount }}</span>
            <span class="stat-label">Upcoming</span>
          </div>
          <div class="stat-pill stat-pill--delayed" *ngIf="delayedCount > 0">
            <mat-icon>warning</mat-icon>
            <span class="stat-value">{{ delayedCount }}</span>
            <span class="stat-label">Delayed</span>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="production-table">
          <thead>
            <tr>
              <th class="col-time">Time</th>
              <th class="col-recipe">Recipe</th>
              <th class="col-qty">Planned</th>
              <th class="col-qty">Actual</th>
              <th class="col-status">Status</th>
              <th class="col-progress">Progress</th>
              <th class="col-notes">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr
              *ngFor="let item of productionItems"
              class="table-row"
              [ngClass]="'row--' + item.status.toLowerCase().replace(' ', '-')"
            >
              <td class="col-time">
                <span class="time-value">{{ item.time }}</span>
              </td>
              <td class="col-recipe">
                <span class="recipe-name">{{ item.recipe }}</span>
              </td>
              <td class="col-qty">
                <span class="qty-value">{{ item.plannedQty }}</span>
              </td>
              <td class="col-qty">
                <span
                  class="qty-value"
                  [class.qty-behind]="item.actualQty < item.plannedQty && (item.status === 'Completed' || item.status === 'Delayed')"
                  [class.qty-ahead]="item.actualQty >= item.plannedQty && item.status === 'Completed'"
                >
                  {{ item.actualQty }}
                </span>
              </td>
              <td class="col-status">
                <span
                  class="status-badge"
                  [ngClass]="'badge--' + item.status.toLowerCase().replace(' ', '-')"
                >
                  {{ item.status }}
                </span>
              </td>
              <td class="col-progress">
                <div class="progress-container">
                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      [style.width.%]="item.progress"
                      [ngClass]="'fill--' + item.status.toLowerCase().replace(' ', '-')"
                    ></div>
                  </div>
                  <span class="progress-text">{{ item.progress }}%</span>
                </div>
              </td>
              <td class="col-notes">
                <span class="notes-text">{{ item.notes || '-' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
    }

    .production-container {
      padding: 24px;
      min-height: 100%;
    }

    .production-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .page-title {
      font-size: 26px;
      font-weight: 700;
      color: #FFFFFF;
      margin: 0;
    }

    .page-date {
      font-size: 15px;
      color: rgba(255, 255, 255, 0.45);
    }

    .header-stats {
      display: flex;
      gap: 12px;
    }

    .stat-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
    }

    .stat-pill mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .stat-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 20px;
      font-weight: 700;
    }

    .stat-label {
      font-size: 13px;
      opacity: 0.7;
    }

    .stat-pill--completed {
      background-color: rgba(129, 199, 132, 0.12);
      color: #81C784;
      border: 1px solid rgba(129, 199, 132, 0.25);
    }

    .stat-pill--progress {
      background-color: rgba(255, 183, 77, 0.12);
      color: #FFB74D;
      border: 1px solid rgba(255, 183, 77, 0.25);
    }

    .stat-pill--scheduled {
      background-color: rgba(79, 195, 247, 0.12);
      color: #4FC3F7;
      border: 1px solid rgba(79, 195, 247, 0.25);
    }

    .stat-pill--delayed {
      background-color: rgba(239, 83, 80, 0.12);
      color: #EF5350;
      border: 1px solid rgba(239, 83, 80, 0.25);
    }

    /* Table */
    .table-wrapper {
      background-color: #16213E;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .production-table {
      width: 100%;
      border-collapse: collapse;
    }

    .production-table thead {
      background-color: rgba(255, 255, 255, 0.04);
    }

    .production-table th {
      padding: 18px 20px;
      text-align: left;
      font-size: 13px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.45);
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .production-table td {
      padding: 20px 20px;
      font-size: 17px;
      color: rgba(255, 255, 255, 0.85);
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .table-row {
      transition: background-color 0.15s ease;
    }

    .table-row:hover {
      background-color: rgba(255, 255, 255, 0.03);
    }

    .table-row:last-child td {
      border-bottom: none;
    }

    .row--delayed {
      background-color: rgba(239, 83, 80, 0.04);
    }

    .col-time {
      width: 100px;
    }

    .col-recipe {
      width: auto;
    }

    .col-qty {
      width: 90px;
      text-align: center;
    }

    .col-status {
      width: 140px;
    }

    .col-progress {
      width: 180px;
    }

    .col-notes {
      width: 200px;
    }

    .time-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      font-weight: 600;
      color: #FFFFFF;
    }

    .recipe-name {
      font-size: 17px;
      font-weight: 600;
      color: #FFFFFF;
    }

    .qty-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      font-weight: 600;
    }

    .qty-behind {
      color: #EF5350;
    }

    .qty-ahead {
      color: #81C784;
    }

    /* Status badges */
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .badge--scheduled {
      background-color: rgba(79, 195, 247, 0.15);
      color: #4FC3F7;
    }

    .badge--in-progress {
      background-color: rgba(255, 183, 77, 0.15);
      color: #FFB74D;
    }

    .badge--completed {
      background-color: rgba(129, 199, 132, 0.15);
      color: #81C784;
    }

    .badge--delayed {
      background-color: rgba(239, 83, 80, 0.15);
      color: #EF5350;
    }

    /* Progress */
    .progress-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .progress-track {
      flex: 1;
      height: 8px;
      background-color: rgba(255, 255, 255, 0.08);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .fill--scheduled {
      background-color: #4FC3F7;
    }

    .fill--in-progress {
      background: linear-gradient(90deg, #FFB74D, #FF9800);
    }

    .fill--completed {
      background-color: #81C784;
    }

    .fill--delayed {
      background-color: #EF5350;
    }

    .progress-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
      min-width: 40px;
      text-align: right;
    }

    .notes-text {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.4);
    }
  `],
})
export class ProductionComponent implements OnInit {
  productionItems: ProductionItem[] = [];

  constructor(private apiClient: ApiClientService) {}

  ngOnInit(): void {
    this.loadProduction();
  }

  private loadProduction(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    this.apiClient
      .get<ProductionPlan[]>(`/v1/production/plans?date=${todayStr}`)
      .subscribe({
        next: (plans) => {
          this.productionItems = [];
          for (const plan of plans) {
            for (const task of plan.tasks) {
              this.productionItems.push(this.mapTask(task));
            }
          }
        },
        error: () => {
          this.productionItems = [];
        },
      });
  }

  private mapTask(task: ProductionTask): ProductionItem {
    const statusMap: Record<string, ProductionStatus> = {
      pending: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      delayed: 'Delayed',
    };
    const planned = task.plannedQuantity;
    const actual = task.actualYield || 0;
    const progress = planned > 0 ? Math.round((actual / planned) * 100) : 0;
    const time = task.scheduledStart
      ? new Date(task.scheduledStart).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '--:--';
    return {
      id: task.id,
      time,
      recipe: task.recipeName || 'Recipe',
      plannedQty: planned,
      actualQty: actual,
      status: statusMap[task.status] || 'Scheduled',
      progress: Math.min(progress, 100),
    };
  }

  get today(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  get completedCount(): number {
    return this.productionItems.filter(i => i.status === 'Completed').length;
  }

  get inProgressCount(): number {
    return this.productionItems.filter(i => i.status === 'In Progress').length;
  }

  get scheduledCount(): number {
    return this.productionItems.filter(i => i.status === 'Scheduled').length;
  }

  get delayedCount(): number {
    return this.productionItems.filter(i => i.status === 'Delayed').length;
  }
}
