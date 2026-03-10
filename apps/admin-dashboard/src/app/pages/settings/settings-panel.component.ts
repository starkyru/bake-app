import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'bake-settings-panel',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatIconModule],
  template: `
    <mat-expansion-panel [expanded]="expanded">
      <mat-expansion-panel-header>
        <mat-panel-title>
          <mat-icon class="panel-icon">{{ icon }}</mat-icon>
          {{ title }}
        </mat-panel-title>
        <mat-panel-description>
          {{ description }}
        </mat-panel-description>
      </mat-expansion-panel-header>
      <ng-content></ng-content>
    </mat-expansion-panel>
  `,
  styles: [
    `
      .panel-icon {
        margin-right: 12px;
        color: #8b4513;
      }

      ::ng-deep .mat-expansion-panel-header-title {
        align-items: center;
        font-weight: 600;
        color: #3e2723;
      }

      ::ng-deep .mat-expansion-panel-header-description {
        align-items: center;
        color: #8d6e63;
      }
    `,
  ],
})
export class SettingsPanelComponent {
  @Input() icon = '';
  @Input() title = '';
  @Input() description = '';
  @Input() expanded = false;
}
