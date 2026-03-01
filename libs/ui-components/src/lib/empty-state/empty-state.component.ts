import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'bake-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state-container">
      <mat-icon class="empty-state-icon">{{ icon }}</mat-icon>
      <h3 class="empty-state-title">{{ title }}</h3>
      <p class="empty-state-message" *ngIf="message">{{ message }}</p>
      <button
        *ngIf="actionLabel"
        mat-flat-button
        color="primary"
        class="empty-state-action"
        (click)="action.emit()"
      >
        {{ actionLabel }}
      </button>
    </div>
  `,
  styles: [
    `
      .empty-state-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
      }

      .empty-state-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #b0bec5;
        margin-bottom: 16px;
      }

      .empty-state-title {
        font-size: 20px;
        font-weight: 500;
        color: #263238;
        margin: 0 0 8px;
      }

      .empty-state-message {
        font-size: 14px;
        color: #607d8b;
        margin: 0 0 24px;
        max-width: 400px;
      }

      .empty-state-action {
        margin-top: 8px;
      }
    `,
  ],
})
export class BakeEmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = '';
  @Input() message = '';
  @Input() actionLabel = '';

  @Output() action = new EventEmitter<void>();
}
