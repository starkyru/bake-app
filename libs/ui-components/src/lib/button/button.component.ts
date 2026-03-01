import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'bake-button',
  standalone: true,
  imports: [CommonModule],
  template: `<button [class.primary]="variant === 'primary'">
    <ng-content></ng-content>
  </button>`,
  styles: [`
    button {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    button.primary {
      background-color: #1976d2;
      color: white;
      border-color: #1976d2;
    }
  `],
})
export class BakeButtonComponent {
  @Input() variant: 'primary' | 'secondary' = 'secondary';
}
