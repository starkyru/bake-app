import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface PaymentDialogData {
  total: number;
  itemCount: number;
}

export interface PaymentDialogResult {
  method: 'cash' | 'card';
  amountPaid: number;
  change: number;
}

@Component({
  selector: 'bake-app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="payment-dialog">
      <div class="dialog-header">
        <h2>Payment</h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="total-display">
        <span class="total-label">Total Due</span>
        <span class="total-amount">${{ data.total | number: '1.0-0' }}</span>
      </div>

      <mat-tab-group
        class="payment-tabs"
        [(selectedIndex)]="selectedTab"
        animationDuration="200ms"
      >
        <!-- Cash Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>payments</mat-icon>
            <span class="tab-label-text">Cash</span>
          </ng-template>

          <div class="tab-content">
            <mat-form-field appearance="outline" class="amount-field">
              <mat-label>Amount received</mat-label>
              <input
                matInput
                type="number"
                [(ngModel)]="cashAmount"
                (ngModelChange)="calculateChange()"
                placeholder="0"
                class="amount-input"
              />
              <span matPrefix class="currency-prefix">$</span>
            </mat-form-field>

            <div class="quick-amounts">
              <button
                mat-stroked-button
                class="quick-btn"
                (click)="setCashAmount(data.total)"
              >
                Exact
              </button>
              <button
                mat-stroked-button
                class="quick-btn"
                (click)="addCashAmount(500)"
              >
                +$500
              </button>
              <button
                mat-stroked-button
                class="quick-btn"
                (click)="addCashAmount(1000)"
              >
                +$1,000
              </button>
              <button
                mat-stroked-button
                class="quick-btn"
                (click)="addCashAmount(2000)"
              >
                +$2,000
              </button>
              <button
                mat-stroked-button
                class="quick-btn"
                (click)="addCashAmount(5000)"
              >
                +$5,000
              </button>
              <button
                mat-stroked-button
                class="quick-btn"
                (click)="setCashAmount(roundUp(data.total, 1000))"
              >
                ${{ roundUp(data.total, 1000) | number: '1.0-0' }}
              </button>
            </div>

            <div class="change-display" *ngIf="cashAmount >= data.total">
              <span class="change-label">Change</span>
              <span class="change-amount">${{ change | number: '1.0-0' }}</span>
            </div>

            <div class="insufficient" *ngIf="cashAmount > 0 && cashAmount < data.total">
              <mat-icon>warning</mat-icon>
              Insufficient amount
            </div>

            <button
              mat-flat-button
              class="confirm-btn cash-btn"
              [disabled]="cashAmount < data.total"
              (click)="confirmPayment('cash')"
            >
              <mat-icon>check_circle</mat-icon>
              Complete Cash Payment
            </button>
          </div>
        </mat-tab>

        <!-- Card Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>credit_card</mat-icon>
            <span class="tab-label-text">Card</span>
          </ng-template>

          <div class="tab-content card-tab">
            <div class="card-processing" *ngIf="!cardProcessing">
              <mat-icon class="card-icon">contactless</mat-icon>
              <p class="card-instruction">
                Tap, insert, or swipe card to process payment
              </p>
              <button
                mat-flat-button
                class="confirm-btn card-btn"
                (click)="processCard()"
              >
                <mat-icon>credit_card</mat-icon>
                Process Card Payment
              </button>
            </div>

            <div class="card-processing" *ngIf="cardProcessing">
              <mat-spinner diameter="48"></mat-spinner>
              <p class="processing-text">Processing payment...</p>
              <p class="processing-subtext">Please do not remove the card</p>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .payment-dialog {
        min-width: 400px;
      }

      .dialog-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .dialog-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #3e2723;
      }

      .total-display {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        background-color: #faf3e8;
        border-radius: 10px;
        margin-bottom: 20px;
      }

      .total-label {
        font-size: 16px;
        font-weight: 500;
        color: #5d4037;
      }

      .total-amount {
        font-size: 28px;
        font-weight: 700;
        color: #8b4513;
        font-family: 'JetBrains Mono', monospace;
      }

      .tab-label-text {
        margin-left: 6px;
      }

      .tab-content {
        padding: 20px 0;
      }

      .amount-field {
        width: 100%;
      }

      .amount-input {
        font-size: 20px;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 600;
      }

      .currency-prefix {
        font-size: 18px;
        font-weight: 600;
        color: #8b4513;
        margin-right: 4px;
      }

      .quick-amounts {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 20px;
      }

      .quick-btn {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 500;
        font-size: 13px;
        border-color: #d4a574;
        color: #5d4037;
      }

      .quick-btn:hover {
        background-color: #faf3e8;
      }

      .change-display {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 20px;
        background-color: #e8f5e9;
        border-radius: 10px;
        margin-bottom: 20px;
      }

      .change-label {
        font-size: 15px;
        font-weight: 500;
        color: #2e7d32;
      }

      .change-amount {
        font-size: 24px;
        font-weight: 700;
        color: #2e7d32;
        font-family: 'JetBrains Mono', monospace;
      }

      .insufficient {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #c62828;
        font-size: 13px;
        padding: 10px 16px;
        background-color: #ffebee;
        border-radius: 8px;
        margin-bottom: 20px;
      }

      .insufficient mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .confirm-btn {
        width: 100%;
        height: 48px;
        font-size: 15px;
        font-weight: 600;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .cash-btn {
        background-color: #2e7d32 !important;
        color: #fff !important;
      }

      .cash-btn:disabled {
        opacity: 0.5;
      }

      .card-btn {
        background-color: #1565c0 !important;
        color: #fff !important;
      }

      .card-tab {
        text-align: center;
      }

      .card-processing {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 24px 0;
      }

      .card-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #1565c0;
      }

      .card-instruction {
        font-size: 15px;
        color: #546e7a;
        margin: 0;
      }

      .processing-text {
        font-size: 16px;
        font-weight: 500;
        color: #3e2723;
        margin: 0;
      }

      .processing-subtext {
        font-size: 13px;
        color: #8d6e63;
        margin: 0;
      }
    `,
  ],
})
export class PaymentDialogComponent {
  cashAmount = 0;
  change = 0;
  selectedTab = 0;
  cardProcessing = false;

  constructor(
    public dialogRef: MatDialogRef<PaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData
  ) {}

  calculateChange(): void {
    this.change = Math.max(0, this.cashAmount - this.data.total);
  }

  setCashAmount(amount: number): void {
    this.cashAmount = amount;
    this.calculateChange();
  }

  addCashAmount(amount: number): void {
    this.cashAmount += amount;
    this.calculateChange();
  }

  roundUp(value: number, step: number): number {
    return Math.ceil(value / step) * step;
  }

  confirmPayment(method: 'cash' | 'card'): void {
    const result: PaymentDialogResult = {
      method,
      amountPaid: method === 'cash' ? this.cashAmount : this.data.total,
      change: method === 'cash' ? this.change : 0,
    };
    this.dialogRef.close(result);
  }

  processCard(): void {
    this.cardProcessing = true;
    // Simulate card processing
    setTimeout(() => {
      this.cardProcessing = false;
      this.confirmPayment('card');
    }, 2000);
  }
}
