import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { SidebarMenuItem } from '../models';

@Component({
  selector: 'bake-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatBadgeModule,
  ],
  template: `
    <div class="sidebar-container">
      <div class="sidebar-header">
        <span class="logo-text">{{ logoText }}</span>
        <span class="sidebar-title">{{ title }}</span>
      </div>

      <mat-nav-list>
        <ng-container *ngFor="let item of menuItems">
          <a
            mat-list-item
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/' }"
            (click)="onMenuItemClick(item)"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
            <span
              *ngIf="item.badge"
              matListItemMeta
              [matBadge]="item.badge"
              [matBadgeColor]="item.badgeColor === 'warn' ? 'warn' : 'primary'"
              matBadgeOverlap="false"
              matBadgeSize="small"
            ></span>
          </a>

          <ng-container *ngIf="item.children?.length">
            <a
              *ngFor="let child of item.children"
              mat-list-item
              class="child-item"
              [routerLink]="child.route"
              routerLinkActive="active"
              (click)="onMenuItemClick(child)"
            >
              <mat-icon matListItemIcon>{{ child.icon }}</mat-icon>
              <span matListItemTitle>{{ child.label }}</span>
            </a>
          </ng-container>
        </ng-container>
      </mat-nav-list>
    </div>
  `,
  styles: [`
    .sidebar-container {
      height: 100%;
      background-color: #263238;
      color: #eceff1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .sidebar-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }

    .logo-text {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .sidebar-title {
      font-size: 12px;
      opacity: 0.7;
      margin-top: 4px;
    }

    mat-nav-list {
      padding-top: 8px;
    }

    a[mat-list-item] {
      color: #eceff1;
      border-left: 3px solid transparent;
    }

    a[mat-list-item]:hover {
      background-color: rgba(255, 255, 255, 0.08);
    }

    a[mat-list-item].active {
      background-color: rgba(255, 255, 255, 0.12);
      border-left-color: #ff9800;
    }

    .child-item {
      padding-left: 24px;
    }
  `],
})
export class BakeSidebarComponent {
  @Input() menuItems: SidebarMenuItem[] = [];
  @Input() title = '';
  @Input() logoText = '';

  @Output() menuItemClick = new EventEmitter<SidebarMenuItem>();

  onMenuItemClick(item: SidebarMenuItem): void {
    this.menuItemClick.emit(item);
  }
}
