import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

export interface OrderCardItem {
  name: string;
  quantity: number;
}

@Component({
  selector: 'bake-order-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  template: `
    <mat-card
      class="order-card"
      [ngClass]="{
        'status-new': status === 'NEW',
        'status-in-progress': status === 'IN_PROGRESS',
        'status-ready': status === 'READY',
        'theme-dark': theme === 'dark'
      }"
    >
      <mat-card-header>
        <mat-card-title class="order-number">#{{ orderNumber }}</mat-card-title>
        <mat-card-subtitle *ngIf="customerName">{{ customerName }}</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div class="order-meta">
          <mat-chip class="status-chip">{{ status }}</mat-chip>
          <span *ngIf="elapsedTime" class="elapsed-time">
            <mat-icon class="time-icon">schedule</mat-icon>
            {{ elapsedTime }}
          </span>
        </div>

        <ul class="order-items">
          <li *ngFor="let item of items" class="order-item">
            <span class="item-quantity">{{ item.quantity }}x</span>
            <span class="item-name">{{ item.name }}</span>
          </li>
        </ul>
      </mat-card-content>

      <mat-card-actions>
        <button
          *ngIf="status === 'NEW'"
          mat-flat-button
          color="primary"
          (click)="statusChange.emit('IN_PROGRESS')"
        >
          <mat-icon>play_arrow</mat-icon>
          START
        </button>
        <button
          *ngIf="status === 'IN_PROGRESS'"
          mat-flat-button
          color="accent"
          (click)="statusChange.emit('READY')"
        >
          <mat-icon>check</mat-icon>
          DONE
        </button>
        <button
          *ngIf="status === 'READY'"
          mat-flat-button
          color="primary"
          (click)="statusChange.emit('PICKED_UP')"
        >
          <mat-icon>delivery_dining</mat-icon>
          PICKED UP
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [
    `
      .order-card {
        margin: 8px;
        border-left: 4px solid #b0bec5;
        transition: border-color 0.2s;
      }

      .order-card.status-new {
        border-left-color: #2196f3;
      }

      .order-card.status-in-progress {
        border-left-color: #ff9800;
      }

      .order-card.status-ready {
        border-left-color: #4caf50;
      }

      .order-card.theme-dark {
        background-color: #263238;
        color: #eceff1;
      }

      .order-number {
        font-size: 18px;
        font-weight: 700;
      }

      .order-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .elapsed-time {
        display: flex;
        align-items: center;
        font-size: 13px;
        color: #607d8b;
      }

      .time-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        margin-right: 4px;
      }

      .order-items {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .order-item {
        display: flex;
        align-items: center;
        padding: 4px 0;
        font-size: 14px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      }

      .order-item:last-child {
        border-bottom: none;
      }

      .item-quantity {
        font-weight: 600;
        margin-right: 8px;
        color: #ff9800;
        min-width: 28px;
      }

      .item-name {
        flex: 1;
      }

      mat-card-actions {
        display: flex;
        justify-content: flex-end;
        padding: 8px 16px;
      }
    `,
  ],
})
export class BakeOrderCardComponent {
  @Input() orderNumber = '';
  @Input() items: OrderCardItem[] = [];
  @Input() status = 'NEW';
  @Input() elapsedTime = '';
  @Input() customerName = '';
  @Input() theme: 'light' | 'dark' = 'light';

  @Output() statusChange = new EventEmitter<string>();
}
