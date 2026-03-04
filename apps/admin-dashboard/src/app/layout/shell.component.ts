import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '@bake-app/auth';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'bake-app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <mat-sidenav mode="side" opened class="sidebar">
        <div class="sidebar-brand">
          <mat-icon class="brand-icon">bakery_dining</mat-icon>
          <span class="brand-title">Bake Admin</span>
        </div>

        <mat-divider></mat-divider>

        <mat-nav-list class="nav-list">
          <a
            mat-list-item
            *ngFor="let item of navItems"
            [routerLink]="item.route"
            routerLinkActive="nav-active"
          >
            <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
            <span matListItemTitle>{{ item.label }}</span>
          </a>
        </mat-nav-list>

        <div class="sidebar-spacer"></div>

        <mat-divider></mat-divider>

        <div class="sidebar-footer">
          <div class="user-info">
            <mat-icon class="user-avatar">account_circle</mat-icon>
            <div class="user-details">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role">{{ userRole }}</span>
            </div>
          </div>
          <button mat-icon-button class="logout-btn" (click)="onLogout()">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="main-content">
        <router-outlet></router-outlet>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .shell-container {
        height: 100vh;
      }

      .sidebar {
        width: 240px;
        background-color: #ffffff;
        border-right: 1px solid #e0d6c8;
      }

      .sidebar-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 16px;
      }

      .brand-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #8b4513;
      }

      .brand-title {
        font-size: 20px;
        font-weight: 700;
        color: #8b4513;
        letter-spacing: 0.5px;
      }

      .nav-list {
        padding-top: 8px;
      }

      a[mat-list-item] {
        margin: 2px 8px;
        border-radius: 8px;
        color: #5d4037;
        transition: background-color 0.2s;
      }

      a[mat-list-item]:hover {
        background-color: #faf3e8;
      }

      a[mat-list-item].nav-active {
        background-color: #8b4513;
        color: #ffffff;
      }

      a[mat-list-item].nav-active mat-icon {
        color: #ffffff;
      }

      .sidebar-spacer {
        flex: 1 1 auto;
      }

      .sidebar-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .user-avatar {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: #8b4513;
      }

      .user-details {
        display: flex;
        flex-direction: column;
      }

      .user-name {
        font-size: 13px;
        font-weight: 600;
        color: #3e2723;
      }

      .user-role {
        font-size: 11px;
        color: #8d6e63;
      }

      .logout-btn {
        color: #8d6e63;
      }

      .logout-btn:hover {
        color: #c62828;
      }

      .main-content {
        background-color: #faf3e8;
        overflow-y: auto;
      }

      /* Make sidebar a flex column so spacer works */
      :host ::ng-deep .mat-drawer-inner-container {
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class ShellComponent implements OnInit {
  navItems: NavItem[] = [
    { label: 'Users', icon: 'people', route: '/users' },
    { label: 'Products', icon: 'inventory_2', route: '/products' },
    { label: 'Categories', icon: 'category', route: '/categories' },
    { label: 'Recipes', icon: 'menu_book', route: '/recipes' },
    { label: 'Settings', icon: 'settings', route: '/settings' },
  ];

  userName = '';
  userRole = '';

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.userName = this.authService.getUserName() || 'User';
    this.userRole = this.authService.getUserRole() || 'Staff';
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
