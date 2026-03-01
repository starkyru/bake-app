import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'bake-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-container">
      <div *ngIf="loading" class="loading-overlay">
        <div class="spinner-wrapper">
          <mat-spinner [diameter]="diameter"></mat-spinner>
          <p *ngIf="message" class="loading-message">{{ message }}</p>
        </div>
      </div>
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .loading-container {
        position: relative;
        min-height: 48px;
      }

      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.7);
        z-index: 10;
        border-radius: 4px;
      }

      .spinner-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .loading-message {
        margin: 0;
        font-size: 14px;
        color: #607d8b;
      }
    `,
  ],
})
export class BakeLoadingSpinnerComponent {
  @Input() loading = false;
  @Input() message = '';
  @Input() diameter = 48;
}
