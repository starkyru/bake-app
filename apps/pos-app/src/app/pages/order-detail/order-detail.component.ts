import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  BakeStatusBadgeComponent,
  BakeCurrencyDisplayComponent,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { Order } from '@bake-app/shared-types';

interface OrderItemView {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OrderDetailView {
  id: string;
  orderNumber: string;
  date: Date;
  status: string;
  paymentMethod: string;
  items: OrderItemView[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  change: number;
  cashier: string;
}

@Component({
  selector: 'bake-app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    BakeStatusBadgeComponent,
    BakeCurrencyDisplayComponent,
  ],
  template: `
    <div class="order-detail-page" *ngIf="order">
      <div class="page-toolbar">
        <button mat-button class="back-btn" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Back to Orders
        </button>
      </div>

      <div class="detail-layout">
        <!-- Order Info Card -->
        <mat-card class="info-card">
          <div class="card-header">
            <div class="order-id-section">
              <h1>Order {{ order.orderNumber }}</h1>
              <bake-status-badge [status]="order.status"></bake-status-badge>
            </div>
            <div class="order-meta">
              <span class="meta-item">
                <mat-icon>calendar_today</mat-icon>
                {{ order.date | date: 'medium' }}
              </span>
              <span class="meta-item">
                <mat-icon>person</mat-icon>
                {{ order.cashier }}
              </span>
              <span class="meta-item">
                <mat-icon>{{ order.paymentMethod === 'Cash' ? 'payments' : 'credit_card' }}</mat-icon>
                {{ order.paymentMethod }}
              </span>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Items table -->
          <div class="items-section">
            <h3>Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th class="col-item">Item</th>
                  <th class="col-qty">Qty</th>
                  <th class="col-price">Price</th>
                  <th class="col-total">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of order.items">
                  <td class="col-item">{{ item.name }}</td>
                  <td class="col-qty">{{ item.quantity }}</td>
                  <td class="col-price">{{ item.unitPrice | currency:'USD':'symbol':'1.0-0' }}</td>
                  <td class="col-total">{{ item.total | currency:'USD':'symbol':'1.0-0' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <mat-divider></mat-divider>

          <!-- Totals -->
          <div class="totals-section">
            <div class="total-line">
              <span>Subtotal</span>
              <span class="amount">{{ order.subtotal | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
            <div class="total-line tax">
              <span>Tax (12%)</span>
              <span class="amount">{{ order.tax | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
            <div class="total-line grand">
              <span>Total</span>
              <bake-currency-display
                [amount]="order.total"
                size="large"
              ></bake-currency-display>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Payment Info -->
          <div class="payment-section">
            <h3>Payment Details</h3>
            <div class="payment-grid">
              <div class="payment-item">
                <span class="payment-label">Method</span>
                <span class="payment-value">{{ order.paymentMethod }}</span>
              </div>
              <div class="payment-item">
                <span class="payment-label">Amount Paid</span>
                <span class="payment-value mono">
                  {{ order.amountPaid | currency:'USD':'symbol':'1.0-0' }}
                </span>
              </div>
              <div class="payment-item" *ngIf="order.change > 0">
                <span class="payment-label">Change</span>
                <span class="payment-value mono change-value">
                  {{ order.change | currency:'USD':'symbol':'1.0-0' }}
                </span>
              </div>
            </div>
          </div>
        </mat-card>
      </div>
    </div>

    <!-- Not found state -->
    <div class="not-found" *ngIf="!order && loaded">
      <mat-icon class="not-found-icon">search_off</mat-icon>
      <h2>Order not found</h2>
      <p>The order you are looking for does not exist.</p>
      <button mat-flat-button class="back-btn-primary" (click)="goBack()">
        <mat-icon>arrow_back</mat-icon>
        Back to Orders
      </button>
    </div>
  `,
  styles: [
    `
      .order-detail-page {
        padding: 24px;
        background-color: #faf3e8;
        min-height: calc(100vh - 64px);
      }

      .page-toolbar {
        margin-bottom: 16px;
      }

      .back-btn {
        color: #8b4513;
        font-weight: 500;
      }

      .detail-layout {
        max-width: 720px;
      }

      .info-card {
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 12px rgba(139, 69, 19, 0.08);
      }

      .card-header {
        margin-bottom: 20px;
      }

      .order-id-section {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }

      .order-id-section h1 {
        font-size: 24px;
        font-weight: 700;
        color: #3e2723;
        margin: 0;
      }

      .order-meta {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #8d6e63;
      }

      .meta-item mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      /* Items */
      .items-section {
        padding: 20px 0;
      }

      .items-section h3 {
        font-size: 16px;
        font-weight: 600;
        color: #3e2723;
        margin: 0 0 12px 0;
      }

      .items-table {
        width: 100%;
        border-collapse: collapse;
      }

      .items-table th {
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        color: #8d6e63;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 8px 0;
        border-bottom: 1px solid #f0e6d8;
      }

      .items-table td {
        padding: 10px 0;
        font-size: 14px;
        color: #3e2723;
        border-bottom: 1px solid #f5efe8;
      }

      .col-qty {
        width: 60px;
        text-align: center;
      }

      .col-price,
      .col-total {
        width: 100px;
        text-align: right;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 500;
      }

      .items-table th.col-qty {
        text-align: center;
      }

      .items-table th.col-price,
      .items-table th.col-total {
        text-align: right;
      }

      /* Totals */
      .totals-section {
        padding: 20px 0;
      }

      .total-line {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        font-size: 14px;
        color: #5d4037;
      }

      .amount {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 500;
      }

      .total-line.tax {
        font-size: 13px;
        color: #8d6e63;
        padding-bottom: 12px;
        margin-bottom: 8px;
        border-bottom: 1px dashed #e0d5c7;
      }

      .total-line.grand {
        font-size: 18px;
        font-weight: 700;
        color: #3e2723;
        padding-top: 8px;
      }

      /* Payment */
      .payment-section {
        padding: 20px 0 0;
      }

      .payment-section h3 {
        font-size: 16px;
        font-weight: 600;
        color: #3e2723;
        margin: 0 0 12px 0;
      }

      .payment-grid {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
      }

      .payment-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .payment-label {
        font-size: 12px;
        font-weight: 500;
        color: #8d6e63;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .payment-value {
        font-size: 15px;
        font-weight: 600;
        color: #3e2723;
      }

      .payment-value.mono {
        font-family: 'JetBrains Mono', monospace;
      }

      .change-value {
        color: #2e7d32;
      }

      /* Not found */
      .not-found {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: calc(100vh - 64px);
        background-color: #faf3e8;
        color: #8d6e63;
      }

      .not-found-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
      }

      .not-found h2 {
        margin: 0 0 8px 0;
        color: #5d4037;
      }

      .not-found p {
        margin: 0 0 24px 0;
      }

      .back-btn-primary {
        background-color: #8b4513 !important;
        color: #fff !important;
      }
    `,
  ],
})
export class OrderDetailComponent implements OnInit {
  order: OrderDetailView | null = null;
  loaded = false;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.apiClient.get<Order>(`/v1/orders/${id}`).subscribe({
      next: (apiOrder) => {
        const statusMap: Record<string, string> = {
          pending: 'Pending',
          confirmed: 'Confirmed',
          in_progress: 'In Progress',
          completed: 'Completed',
          cancelled: 'Cancelled',
        };
        const payment = apiOrder.payments?.[0];
        const amountPaid = apiOrder.payments?.reduce(
          (sum, p) => sum + p.amount,
          0,
        ) || 0;
        this.order = {
          id: apiOrder.id,
          orderNumber: apiOrder.orderNumber,
          date: new Date(apiOrder.createdAt),
          status: statusMap[apiOrder.status] || apiOrder.status,
          paymentMethod: payment?.method === 'cash' ? 'Cash' : 'Card',
          items: apiOrder.items.map((item) => ({
            name: item.product?.name || 'Item',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.subtotal,
          })),
          subtotal: apiOrder.subtotal,
          tax: apiOrder.tax,
          total: apiOrder.total,
          amountPaid,
          change: Math.max(0, amountPaid - apiOrder.total),
          cashier: apiOrder.userId || 'Unknown',
        };
        this.loaded = true;
        this.loading = false;
      },
      error: () => {
        this.order = null;
        this.loaded = true;
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }
}
