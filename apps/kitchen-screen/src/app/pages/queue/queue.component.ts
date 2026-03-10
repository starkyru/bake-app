import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApiClientService } from '@bake-app/api-client';
import { AuthService } from '@bake-app/auth';
import { Order } from '@bake-app/shared-types';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface OrderItem {
  name: string;
  quantity: number;
  done: boolean;
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  status: 'NEW' | 'IN_PROGRESS' | 'READY';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

@Component({
  selector: 'bake-app-queue',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  template: `
    <div class="queue-container">
      <!-- NEW Column -->
      <div class="queue-column">
        <div class="column-header column-header--new">
          <div class="column-header-left">
            <mat-icon>fiber_new</mat-icon>
            <span class="column-title">NEW</span>
          </div>
          <span class="column-count">{{ newOrders.length }}</span>
        </div>
        <div class="column-body">
          <div
            *ngFor="let order of newOrders"
            class="order-card order-card--new"
            (click)="navigateToDetail(order.id)"
          >
            <div class="card-top">
              <span class="order-number">#{{ order.orderNumber }}</span>
              <span class="elapsed-time">
                <mat-icon class="time-icon">schedule</mat-icon>
                {{ getElapsedTime(order.createdAt) }}
              </span>
            </div>

            <div class="customer-name">{{ order.customerName }}</div>

            <ul class="item-list">
              <li *ngFor="let item of order.items" class="item-row">
                <span class="item-qty">{{ item.quantity }}x</span>
                <span class="item-name">{{ item.name }}</span>
              </li>
            </ul>

            <button
              class="action-btn action-btn--start"
              (click)="startOrder(order); $event.stopPropagation()"
            >
              <mat-icon>play_arrow</mat-icon>
              START
            </button>
          </div>
        </div>
      </div>

      <!-- IN PROGRESS Column -->
      <div class="queue-column">
        <div class="column-header column-header--progress">
          <div class="column-header-left">
            <mat-icon>autorenew</mat-icon>
            <span class="column-title">IN PROGRESS</span>
          </div>
          <span class="column-count">{{ inProgressOrders.length }}</span>
        </div>
        <div class="column-body">
          <div
            *ngFor="let order of inProgressOrders"
            class="order-card order-card--progress"
            (click)="navigateToDetail(order.id)"
          >
            <div class="card-top">
              <span class="order-number">#{{ order.orderNumber }}</span>
              <span class="elapsed-time elapsed-time--active">
                <mat-icon class="time-icon">timer</mat-icon>
                {{ getElapsedTime(order.startedAt!) }}
              </span>
            </div>

            <div class="customer-name">{{ order.customerName }}</div>

            <ul class="item-list item-list--checkable">
              <li *ngFor="let item of order.items" class="item-row item-row--checkable">
                <mat-checkbox
                  [checked]="item.done"
                  (change)="toggleItem(item); $event.source?.focus()"
                  (click)="$event.stopPropagation()"
                  color="accent"
                  class="item-checkbox"
                >
                  <span [class.item-done]="item.done">
                    <span class="item-qty">{{ item.quantity }}x</span>
                    {{ item.name }}
                  </span>
                </mat-checkbox>
              </li>
            </ul>

            <div class="progress-bar-container">
              <div
                class="progress-bar"
                [style.width.%]="getProgress(order)"
              ></div>
            </div>

            <button
              class="action-btn action-btn--done"
              (click)="completeOrder(order); $event.stopPropagation()"
            >
              <mat-icon>check_circle</mat-icon>
              DONE
            </button>
          </div>
        </div>
      </div>

      <!-- READY Column -->
      <div class="queue-column">
        <div class="column-header column-header--ready">
          <div class="column-header-left">
            <mat-icon>check_circle</mat-icon>
            <span class="column-title">READY</span>
          </div>
          <span class="column-count">{{ readyOrders.length }}</span>
        </div>
        <div class="column-body">
          <div
            *ngFor="let order of readyOrders"
            class="order-card order-card--ready"
          >
            <div class="card-top">
              <span class="order-number">#{{ order.orderNumber }}</span>
              <span class="elapsed-time elapsed-time--ready">
                <mat-icon class="time-icon">done_all</mat-icon>
                {{ getElapsedTime(order.completedAt!) }}
              </span>
            </div>

            <div class="customer-name customer-name--ready">
              {{ order.customerName }}
            </div>

            <ul class="item-list">
              <li *ngFor="let item of order.items" class="item-row">
                <span class="item-qty">{{ item.quantity }}x</span>
                <span class="item-name">{{ item.name }}</span>
              </li>
            </ul>

            <button
              class="action-btn action-btn--pickup"
              (click)="pickupOrder(order)"
            >
              <mat-icon>delivery_dining</mat-icon>
              PICKED UP
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .queue-container {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      padding: 16px;
      height: 100%;
      overflow: hidden;
    }

    .queue-column {
      display: flex;
      flex-direction: column;
      background-color: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      overflow: hidden;
    }

    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .column-header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .column-header mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .column-header--new {
      background-color: rgba(79, 195, 247, 0.15);
      color: #4FC3F7;
      border-bottom: 3px solid #4FC3F7;
    }

    .column-header--progress {
      background-color: rgba(255, 183, 77, 0.15);
      color: #FFB74D;
      border-bottom: 3px solid #FFB74D;
    }

    .column-header--ready {
      background-color: rgba(129, 199, 132, 0.15);
      color: #81C784;
      border-bottom: 3px solid #81C784;
    }

    .column-count {
      background-color: rgba(255, 255, 255, 0.15);
      padding: 4px 12px;
      border-radius: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 16px;
      font-weight: 700;
    }

    .column-body {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Order Cards */
    .order-card {
      background-color: #16213E;
      border-radius: 12px;
      padding: 20px;
      border-left: 5px solid transparent;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .order-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    .order-card--new {
      border-left-color: #4FC3F7;
    }

    .order-card--progress {
      border-left-color: #FFB74D;
    }

    .order-card--ready {
      border-left-color: #81C784;
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .order-number {
      font-family: 'JetBrains Mono', monospace;
      font-size: 22px;
      font-weight: 700;
      color: #FFFFFF;
    }

    .elapsed-time {
      display: flex;
      align-items: center;
      gap: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 16px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.5);
    }

    .elapsed-time--active {
      color: #FFB74D;
    }

    .elapsed-time--ready {
      color: #81C784;
    }

    .time-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .customer-name {
      font-size: 15px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.65);
      margin-bottom: 14px;
    }

    .customer-name--ready {
      font-size: 20px;
      font-weight: 700;
      color: #81C784;
      text-align: center;
      margin: 8px 0 16px;
    }

    .item-list {
      list-style: none;
      padding: 0;
      margin: 0 0 16px 0;
    }

    .item-row {
      display: flex;
      align-items: center;
      padding: 6px 0;
      font-size: 16px;
      color: rgba(255, 255, 255, 0.85);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .item-row:last-child {
      border-bottom: none;
    }

    .item-row--checkable {
      padding: 2px 0;
    }

    .item-qty {
      font-weight: 700;
      margin-right: 10px;
      color: #FFB74D;
      min-width: 32px;
      font-family: 'JetBrains Mono', monospace;
    }

    .item-name {
      flex: 1;
    }

    .item-done {
      text-decoration: line-through;
      color: rgba(255, 255, 255, 0.35);
    }

    .item-checkbox {
      width: 100%;
    }

    .item-checkbox ::ng-deep .mdc-form-field {
      color: rgba(255, 255, 255, 0.85);
      font-size: 16px;
    }

    .item-checkbox ::ng-deep .mdc-checkbox__background {
      border-color: rgba(255, 255, 255, 0.4) !important;
    }

    /* Progress bar */
    .progress-bar-container {
      width: 100%;
      height: 6px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #FFB74D, #FF9800);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    /* Action Buttons - 80px minimum touch targets */
    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      min-height: 80px;
      border: none;
      border-radius: 10px;
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 1px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-transform: uppercase;
    }

    .action-btn mat-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
    }

    .action-btn--start {
      background-color: #4FC3F7;
      color: #0D1B2A;
    }

    .action-btn--start:hover {
      background-color: #29B6F6;
      box-shadow: 0 4px 16px rgba(79, 195, 247, 0.35);
    }

    .action-btn--start:active {
      transform: scale(0.98);
    }

    .action-btn--done {
      background-color: #FFB74D;
      color: #1A1A2E;
    }

    .action-btn--done:hover {
      background-color: #FFA726;
      box-shadow: 0 4px 16px rgba(255, 183, 77, 0.35);
    }

    .action-btn--done:active {
      transform: scale(0.98);
    }

    .action-btn--pickup {
      background-color: #81C784;
      color: #1A1A2E;
    }

    .action-btn--pickup:hover {
      background-color: #66BB6A;
      box-shadow: 0 4px 16px rgba(129, 199, 132, 0.35);
    }

    .action-btn--pickup:active {
      transform: scale(0.98);
    }
  `],
})
export class QueueComponent implements OnInit, OnDestroy {
  orders: KitchenOrder[] = [];
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private socket: Socket | null = null;

  constructor(
    private router: Router,
    private apiClient: ApiClientService,
    private authService: AuthService,
  ) {}

  get newOrders(): KitchenOrder[] {
    return this.orders.filter(o => o.status === 'NEW');
  }

  get inProgressOrders(): KitchenOrder[] {
    return this.orders.filter(o => o.status === 'IN_PROGRESS');
  }

  get readyOrders(): KitchenOrder[] {
    return this.orders.filter(o => o.status === 'READY');
  }

  ngOnInit(): void {
    this.loadOrders();
    this.connectWebSocket();
    this.timerInterval = setInterval(() => {
      this.orders = [...this.orders];
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  startOrder(order: KitchenOrder): void {
    this.apiClient
      .put(`/v1/orders/${order.id}/status`, { status: 'in_progress' })
      .subscribe({
        next: () => {
          order.status = 'IN_PROGRESS';
          order.startedAt = new Date();
        },
      });
  }

  completeOrder(order: KitchenOrder): void {
    this.apiClient
      .put(`/v1/orders/${order.id}/status`, { status: 'completed' })
      .subscribe({
        next: () => {
          order.status = 'READY';
          order.completedAt = new Date();
          order.items.forEach(item => item.done = true);
        },
      });
  }

  pickupOrder(order: KitchenOrder): void {
    this.apiClient
      .put(`/v1/orders/${order.id}/status`, { status: 'delivered' })
      .subscribe({
        next: () => {
          this.orders = this.orders.filter(o => o.id !== order.id);
        },
      });
  }

  toggleItem(item: OrderItem): void {
    item.done = !item.done;
  }

  getProgress(order: KitchenOrder): number {
    if (order.items.length === 0) return 0;
    const doneCount = order.items.filter(i => i.done).length;
    return Math.round((doneCount / order.items.length) * 100);
  }

  getElapsedTime(since: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - since.getTime();
    const totalSeconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    }

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  navigateToDetail(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  private connectWebSocket(): void {
    const token = this.authService.getToken();
    this.socket = io(environment.wsUrl || window.location.origin, {
      auth: { token },
    });

    this.socket.on('order:new', () => {
      this.loadOrders();
    });

    this.socket.on('order:statusChanged', (payload: { orderId: string; newStatus: string }) => {
      const statusMap: Record<string, KitchenOrder['status']> = {
        pending: 'NEW',
        confirmed: 'NEW',
        in_progress: 'IN_PROGRESS',
        completed: 'READY',
      };
      const mappedStatus = statusMap[payload.newStatus];
      if (mappedStatus) {
        const order = this.orders.find(o => o.id === payload.orderId);
        if (order) {
          order.status = mappedStatus;
          if (mappedStatus === 'IN_PROGRESS') {
            order.startedAt = new Date();
          } else if (mappedStatus === 'READY') {
            order.completedAt = new Date();
            order.items.forEach(item => item.done = true);
          }
          this.orders = [...this.orders];
        }
      } else if (['delivered', 'cancelled'].includes(payload.newStatus)) {
        this.orders = this.orders.filter(o => o.id !== payload.orderId);
      }
    });
  }

  private loadOrders(): void {
    this.apiClient
      .get<PaginatedResponse<Order>>('/v1/orders?limit=50')
      .subscribe({
        next: (response) => {
          this.orders = response.data
            .filter((o) => ['pending', 'confirmed', 'in_progress', 'completed'].includes(o.status))
            .map((o) => this.mapOrder(o));
        },
      });
  }

  private mapOrder(o: Order): KitchenOrder {
    const statusMap: Record<string, KitchenOrder['status']> = {
      pending: 'NEW',
      confirmed: 'NEW',
      in_progress: 'IN_PROGRESS',
      completed: 'READY',
    };
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.notes || `Order ${o.orderNumber}`,
      status: statusMap[o.status] || 'NEW',
      createdAt: new Date(o.createdAt),
      startedAt: o.status === 'in_progress' ? new Date(o.updatedAt) : undefined,
      completedAt: o.status === 'completed' ? new Date(o.updatedAt) : undefined,
      items: o.items.map((item) => ({
        name: item.product?.name || 'Item',
        quantity: item.quantity,
        done: o.status === 'completed',
      })),
    };
  }
}
