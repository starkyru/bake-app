import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'bake-inventory-item',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="inventory-item" [ngClass]="'status-' + status?.toLowerCase()">
      <div class="item-info">
        <span class="item-name">{{ name }}</span>
        <span class="item-quantity">
          {{ quantity }} {{ unit }}
        </span>
      </div>
      <div class="item-status-section">
        <div class="level-bar-container" *ngIf="minLevel > 0">
          <div
            class="level-bar"
            [style.width.%]="levelPercentage"
            [ngClass]="{
              'level-critical': levelPercentage < 25,
              'level-warning': levelPercentage >= 25 && levelPercentage < 50,
              'level-ok': levelPercentage >= 50
            }"
          ></div>
        </div>
        <span class="status-badge" [ngClass]="'badge-' + status?.toLowerCase()">
          <mat-icon class="status-icon">{{ statusIcon }}</mat-icon>
          {{ status }}
        </span>
      </div>
    </div>
  `,
  styles: [
    `
      .inventory-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background-color: #fff;
        transition: box-shadow 0.2s;
      }

      .inventory-item:hover {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
      }

      .item-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .item-name {
        font-size: 14px;
        font-weight: 500;
        color: #263238;
      }

      .item-quantity {
        font-size: 13px;
        color: #607d8b;
        font-family: 'JetBrains Mono', monospace;
      }

      .item-status-section {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
      }

      .level-bar-container {
        width: 80px;
        height: 6px;
        background-color: #eceff1;
        border-radius: 3px;
        overflow: hidden;
      }

      .level-bar {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s;
      }

      .level-critical {
        background-color: #f44336;
      }

      .level-warning {
        background-color: #ff9800;
      }

      .level-ok {
        background-color: #4caf50;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .status-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .badge-in_stock {
        background-color: #e8f5e9;
        color: #2e7d32;
      }

      .badge-low_stock {
        background-color: #fff3e0;
        color: #ef6c00;
      }

      .badge-out_of_stock {
        background-color: #ffebee;
        color: #c62828;
      }

      .badge-expired {
        background-color: #fce4ec;
        color: #ad1457;
      }
    `,
  ],
})
export class BakeInventoryItemComponent {
  @Input() name = '';
  @Input() quantity = 0;
  @Input() unit = '';
  @Input() minLevel = 0;
  @Input() status = 'IN_STOCK';

  get levelPercentage(): number {
    if (this.minLevel <= 0) return 100;
    return Math.min(100, Math.round((this.quantity / (this.minLevel * 2)) * 100));
  }

  get statusIcon(): string {
    switch (this.status?.toUpperCase()) {
      case 'IN_STOCK':
        return 'check_circle';
      case 'LOW_STOCK':
        return 'warning';
      case 'OUT_OF_STOCK':
        return 'error';
      case 'EXPIRED':
        return 'dangerous';
      default:
        return 'info';
    }
  }
}
