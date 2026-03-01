import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { TabItem } from '../models';

@Component({
  selector: 'bake-tab-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatTabsModule,
    MatIconModule,
  ],
  template: `
    <nav mat-tab-nav-bar [tabPanel]="tabPanel" color="primary">
      <a
        mat-tab-link
        *ngFor="let tab of tabs"
        [routerLink]="tab.route"
        routerLinkActive
        #rla="routerLinkActive"
        [active]="rla.isActive"
      >
        <mat-icon *ngIf="tab.icon" class="tab-icon">{{ tab.icon }}</mat-icon>
        <span>{{ tab.label }}</span>
        <span *ngIf="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </a>
    </nav>
    <mat-tab-nav-panel #tabPanel></mat-tab-nav-panel>
  `,
  styles: [
    `
      .tab-icon {
        margin-right: 8px;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .tab-badge {
        margin-left: 8px;
        background-color: #ff5722;
        color: white;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
      }
    `,
  ],
})
export class BakeTabNavigationComponent {
  @Input() tabs: TabItem[] = [];
}
