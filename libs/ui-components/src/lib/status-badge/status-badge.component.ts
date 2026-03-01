import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';

type BadgeColor = 'green' | 'amber' | 'red' | 'default';

const STATUS_COLOR_MAP: Record<string, BadgeColor> = {
  completed: 'green',
  active: 'green',
  'in-stock': 'green',
  in_stock: 'green',
  approved: 'green',
  done: 'green',
  ready: 'green',

  pending: 'amber',
  'low-stock': 'amber',
  low_stock: 'amber',
  'in-progress': 'amber',
  in_progress: 'amber',
  processing: 'amber',
  warning: 'amber',
  review: 'amber',

  cancelled: 'amber',
  inactive: 'red',
  'out-of-stock': 'red',
  out_of_stock: 'red',
  error: 'red',
  failed: 'red',
  rejected: 'red',
  expired: 'red',
};

@Component({
  selector: 'bake-status-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  template: `
    <mat-chip [class]="'status-badge status-badge--' + badgeColor + ' status-badge--' + size">
      {{ status }}
    </mat-chip>
  `,
  styles: [
    `
      .status-badge {
        font-weight: 600;
        text-transform: capitalize;
      }

      .status-badge--small {
        font-size: 11px;
        min-height: 24px;
        padding: 0 8px;
      }

      .status-badge--medium {
        font-size: 13px;
        min-height: 28px;
        padding: 0 12px;
      }

      .status-badge--green {
        background-color: #e8f5e9 !important;
        color: #2e7d32 !important;
      }

      .status-badge--amber {
        background-color: #fff8e1 !important;
        color: #f57f17 !important;
      }

      .status-badge--red {
        background-color: #ffebee !important;
        color: #c62828 !important;
      }

      .status-badge--default {
        background-color: #eceff1 !important;
        color: #546e7a !important;
      }
    `,
  ],
})
export class BakeStatusBadgeComponent implements OnChanges {
  @Input() status = '';
  @Input() size: 'small' | 'medium' = 'medium';

  badgeColor: BadgeColor = 'default';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['status']) {
      this.badgeColor = this.resolveColor(this.status);
    }
  }

  private resolveColor(status: string): BadgeColor {
    if (!status) {
      return 'default';
    }
    const normalized = status.toLowerCase().replace(/\s+/g, '-');
    return STATUS_COLOR_MAP[normalized] ?? 'default';
  }
}
