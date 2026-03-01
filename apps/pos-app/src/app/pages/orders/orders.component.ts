import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  BakeDataTableComponent,
  BakeStatusBadgeComponent,
  TableColumn,
} from '@bake-app/ui-components';

interface OrderRow {
  id: number;
  orderNumber: string;
  date: Date;
  items: string;
  total: number;
  status: string;
}

const SAMPLE_ORDERS: OrderRow[] = [
  {
    id: 1,
    orderNumber: '#001',
    date: new Date(2026, 2, 1, 9, 15),
    items: 'Cappuccino x2, Croissant x1',
    total: 3050,
    status: 'Completed',
  },
  {
    id: 2,
    orderNumber: '#002',
    date: new Date(2026, 2, 1, 9, 32),
    items: 'Latte x1, Tiramisu x1',
    total: 3136,
    status: 'Completed',
  },
  {
    id: 3,
    orderNumber: '#003',
    date: new Date(2026, 2, 1, 10, 5),
    items: 'Americano x1, Turkey Club x1',
    total: 3024,
    status: 'In Progress',
  },
  {
    id: 4,
    orderNumber: '#004',
    date: new Date(2026, 2, 1, 10, 20),
    items: 'Espresso x3, Danish Pastry x2',
    total: 4256,
    status: 'Pending',
  },
  {
    id: 5,
    orderNumber: '#005',
    date: new Date(2026, 2, 1, 10, 45),
    items: 'Flat White x1, Cheesecake x1',
    total: 2912,
    status: 'Completed',
  },
  {
    id: 6,
    orderNumber: '#006',
    date: new Date(2026, 2, 1, 11, 0),
    items: 'Mocha x2, Brownie x2',
    total: 4928,
    status: 'Cancelled',
  },
  {
    id: 7,
    orderNumber: '#007',
    date: new Date(2026, 2, 1, 11, 22),
    items: 'Chai Latte x1, Cinnamon Roll x1',
    total: 2240,
    status: 'Completed',
  },
  {
    id: 8,
    orderNumber: '#008',
    date: new Date(2026, 2, 1, 11, 40),
    items: 'Cappuccino x1, Ham & Cheese x1',
    total: 3024,
    status: 'In Progress',
  },
  {
    id: 9,
    orderNumber: '#009',
    date: new Date(2026, 2, 1, 12, 5),
    items: 'Green Smoothie x2, Veggie Wrap x1',
    total: 4480,
    status: 'Pending',
  },
  {
    id: 10,
    orderNumber: '#010',
    date: new Date(2026, 2, 1, 12, 30),
    items: 'Hot Chocolate x1, Eclair x2',
    total: 3136,
    status: 'Completed',
  },
];

@Component({
  selector: 'bake-app-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
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
export class OrdersComponent {
  orders: OrderRow[] = SAMPLE_ORDERS;

  columns: TableColumn[] = [
    { key: 'orderNumber', label: 'Order #', sortable: true, width: '100px' },
    { key: 'date', label: 'Date', type: 'date', sortable: true, width: '160px' },
    { key: 'items', label: 'Items', sortable: false },
    { key: 'total', label: 'Total', type: 'currency', sortable: true, width: '120px' },
    { key: 'status', label: 'Status', type: 'badge', sortable: true, width: '130px' },
    { key: 'actions', label: '', type: 'actions', width: '100px' },
  ];

  constructor(private router: Router) {}

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
