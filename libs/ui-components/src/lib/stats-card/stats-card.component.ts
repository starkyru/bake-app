import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'bake-stats-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="stats-card" [class]="'stats-card--' + color">
      <mat-card-content>
        <div class="stats-card__layout">
          <div class="stats-card__icon-wrapper" [class]="'icon--' + color">
            <mat-icon>{{ icon }}</mat-icon>
          </div>
          <div class="stats-card__content">
            <span class="stats-card__title">{{ title }}</span>
            <span class="stats-card__value">{{ value }}</span>
            <div class="stats-card__trend" *ngIf="trend !== undefined">
              <mat-icon
                class="trend-icon"
                [class.trend-up]="trend >= 0"
                [class.trend-down]="trend < 0"
              >
                {{ trend >= 0 ? 'trending_up' : 'trending_down' }}
              </mat-icon>
              <span
                class="trend-value"
                [class.trend-up]="trend >= 0"
                [class.trend-down]="trend < 0"
              >
                {{ trend >= 0 ? '+' : '' }}{{ trend }}%
              </span>
              <span class="trend-label" *ngIf="trendLabel">
                {{ trendLabel }}
              </span>
            </div>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .stats-card {
        border-radius: 12px;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .stats-card:hover {
        transform: translateY(-2px);
        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.1),
          0 2px 4px rgba(0, 0, 0, 0.06);
      }

      .stats-card__layout {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      .stats-card__icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        flex-shrink: 0;
      }

      .stats-card__icon-wrapper mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .icon--primary {
        background-color: #e3f2fd;
        color: #1976d2;
      }

      .icon--accent {
        background-color: #fff3e0;
        color: #ff9800;
      }

      .icon--warn {
        background-color: #ffebee;
        color: #f44336;
      }

      .stats-card__content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .stats-card__title {
        font-size: 13px;
        font-weight: 500;
        color: #78909c;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .stats-card__value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 28px;
        font-weight: 700;
        line-height: 1.2;
        color: #263238;
      }

      .stats-card__trend {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 4px;
      }

      .trend-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .trend-value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        font-weight: 600;
      }

      .trend-up {
        color: #2e7d32;
      }

      .trend-down {
        color: #c62828;
      }

      .trend-label {
        font-size: 12px;
        color: #90a4ae;
        margin-left: 4px;
      }
    `,
  ],
})
export class BakeStatsCardComponent {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() icon = 'bar_chart';
  @Input() trend?: number;
  @Input() trendLabel = '';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
}
