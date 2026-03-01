import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'bake-product-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card
      class="product-card"
      (click)="addToCart.emit()"
      tabindex="0"
      role="button"
      [attr.aria-label]="'Add ' + name + ' to cart'"
    >
      <div class="product-image-wrapper" *ngIf="image">
        <img [src]="image" [alt]="name" class="product-image" />
      </div>
      <div class="product-image-wrapper product-placeholder" *ngIf="!image">
        <mat-icon class="placeholder-icon">bakery_dining</mat-icon>
      </div>
      <mat-card-content class="product-info">
        <span class="product-category" *ngIf="category">{{ category }}</span>
        <span class="product-name">{{ name }}</span>
        <span class="product-price">{{ price | currency: 'UAH':'symbol-narrow':'1.2-2' }}</span>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .product-card {
        min-width: 120px;
        min-height: 100px;
        cursor: pointer;
        transition: box-shadow 0.2s, transform 0.1s;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }

      .product-card:hover {
        box-shadow:
          0 4px 8px rgba(0, 0, 0, 0.12),
          0 2px 4px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }

      .product-card:active {
        transform: scale(0.97);
      }

      .product-image-wrapper {
        width: 100%;
        height: 80px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f5f5f5;
        border-radius: 4px 4px 0 0;
      }

      .product-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .product-placeholder {
        background-color: #eceff1;
      }

      .placeholder-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: #b0bec5;
      }

      .product-info {
        display: flex;
        flex-direction: column;
        padding: 8px;
        gap: 2px;
      }

      .product-category {
        font-size: 11px;
        color: #90a4ae;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .product-name {
        font-size: 14px;
        font-weight: 500;
        color: #263238;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .product-price {
        font-size: 16px;
        font-weight: 700;
        color: #ff9800;
        font-family: 'JetBrains Mono', monospace;
      }
    `,
  ],
})
export class BakeProductCardComponent {
  @Input() name = '';
  @Input() price = 0;
  @Input() image = '';
  @Input() category = '';

  @Output() addToCart = new EventEmitter<void>();
}
