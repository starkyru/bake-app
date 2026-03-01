import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'bake-currency-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="currency-display" [class]="'currency-display--' + size">
      <span class="currency-symbol" *ngIf="showSymbol">&#8376;</span>
      <span class="currency-amount">{{ amount | number : '1.0-0' }}</span>
    </span>
  `,
  styles: [
    `
      .currency-display {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 500;
        display: inline-flex;
        align-items: baseline;
        gap: 2px;
      }

      .currency-display--small {
        font-size: 14px;
      }

      .currency-display--medium {
        font-size: 18px;
      }

      .currency-display--large {
        font-size: 28px;
        font-weight: 700;
      }

      .currency-symbol {
        font-weight: 600;
      }
    `,
  ],
})
export class BakeCurrencyDisplayComponent {
  @Input() amount = 0;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showSymbol = true;
}
