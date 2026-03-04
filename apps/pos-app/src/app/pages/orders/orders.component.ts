import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  BakeDataTableComponent,
  BakeStatusBadgeComponent,
  TableColumn,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { Order } from '@bake-app/shared-types';

interface OrderRow {
  id: string;
  orderNumber: string;
  date: Date;
  items: string;
  total: number;
  status: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'bake-app-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BakeDataTableComponent,
    BakeStatusBadgeComponent,
  ],
  template: `
    <div class="orders-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Order History</h1>
          <p class="subtitle">View and manage all orders</p>
        </div>
        <div class="header-stats">
          <div class="stat-pill">
            <mat-icon>receipt</mat-icon>
            <span>{{ orders.length }} orders today</span>
          </div>
          <div class="stat-pill completed">
            <mat-icon>check_circle</mat-icon>
            <span>{{ completedCount }} completed</span>
          </div>
          <div class="stat-pill pending">
            <mat-icon>schedule</mat-icon>
            <span>{{ pendingCount }} pending</span>
          </div>
        </div>
      </div>

      <bake-data-table
        [columns]="columns"
        [data]="orders"
        [searchable]="true"
        (rowClick)="onRowClick($event)"
        (rowAction)="onRowAction($event)"
      ></bake-data-table>
    </div>
  `,
  styles: [
    `
      .orders-page {
        padding: 24px;
        background-color: #faf3e8;
        min-height: calc(100vh - 64px);
      }

      .page-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 24px;
      }

      .header-left h1 {
        font-size: 24px;
        font-weight: 700;
        color: #3e2723;
        margin: 0 0 4px 0;
      }

      .subtitle {
        font-size: 14px;
        color: #8d6e63;
        margin: 0;
      }

      .header-stats {
        display: flex;
        gap: 12px;
      }

      .stat-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background-color: #fff;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
        color: #5d4037;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .stat-pill mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .stat-pill.completed {
        color: #2e7d32;
        background-color: #e8f5e9;
      }

      .stat-pill.pending {
        color: #f57f17;
        background-color: #fff8e1;
      }
    `,
  ],
})
export class OrdersComponent implements OnInit {
  orders: OrderRow[] = [];
  loading = true;
  errorMessage = '';

  columns: TableColumn[] = [
    { key: 'orderNumber', label: 'Order #', sortable: true, width: '100px' },
    { key: 'date', label: 'Date', type: 'date', sortable: true, width: '160px' },
    { key: 'items', label: 'Items', sortable: false },
    { key: 'total', label: 'Total', type: 'currency', sortable: true, width: '120px' },
    { key: 'status', label: 'Status', type: 'badge', sortable: true, width: '130px' },
    { key: 'actions', label: '', type: 'actions', width: '100px' },
  ];

  constructor(
    private router: Router,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';
    this.apiClient.get<PaginatedResponse<Order>>('/v1/orders?limit=50').subscribe({
      next: (response) => {
        this.orders = response.data.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          date: new Date(order.createdAt),
          items: order.items
            .map((item) => `${item.product?.name || 'Item'} x${item.quantity}`)
            .join(', '),
          total: order.total,
          status: this.formatStatus(order.status),
        }));
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load orders.';
        this.loading = false;
      },
    });
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return statusMap[status] || status;
  }

  get completedCount(): number {
    return this.orders.filter((o) => o.status === 'Completed').length;
  }

  get pendingCount(): number {
    return this.orders.filter(
      (o) => o.status === 'Pending' || o.status === 'In Progress'
    ).length;
  }

  onRowClick(row: OrderRow): void {
    this.router.navigate(['/orders', row.id]);
  }

  onRowAction(event: { action: string; row: OrderRow }): void {
    if (event.action === 'edit') {
      this.router.navigate(['/orders', event.row.id]);
    }
  }
}
