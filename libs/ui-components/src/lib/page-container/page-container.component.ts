import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'bake-page-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header" *ngIf="title">
        <h1 class="page-title">{{ title }}</h1>
        <p class="page-subtitle" *ngIf="subtitle">{{ subtitle }}</p>
      </div>

      <div class="page-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 24px;
      font-weight: 500;
      color: #263238;
      margin: 0 0 4px;
    }

    .page-subtitle {
      font-size: 14px;
      color: #607d8b;
      margin: 0;
    }

    .page-content {
      width: 100%;
    }
  `],
})
export class BakePageContainerComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
