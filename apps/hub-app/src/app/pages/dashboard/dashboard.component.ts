import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserRole } from '@bake-app/shared-types';

interface AppLink {
  name: string;
  description: string;
  icon: string;
  url: string;
  color: string;
}

const ROLE_APP_MAP: Record<string, AppLink[]> = {
  [UserRole.OWNER]: [
    {
      name: 'POS',
      description: 'Point of Sale terminal',
      icon: 'point_of_sale',
      url: 'https://pos.bake.ilia.to',
      color: '#4caf50',
    },
    {
      name: 'Admin',
      description: 'Administration panel',
      icon: 'admin_panel_settings',
      url: 'https://admin.bake.ilia.to',
      color: '#2196f3',
    },
    {
      name: 'Kitchen',
      description: 'Kitchen display system',
      icon: 'restaurant',
      url: 'https://kitchen.bake.ilia.to',
      color: '#ff9800',
    },
    {
      name: 'Manager',
      description: 'Manager dashboard',
      icon: 'dashboard',
      url: 'https://manager.bake.ilia.to',
      color: '#9c27b0',
    },
  ],
  [UserRole.MANAGER]: [
    {
      name: 'POS',
      description: 'Point of Sale terminal',
      icon: 'point_of_sale',
      url: 'https://pos.bake.ilia.to',
      color: '#4caf50',
    },
    {
      name: 'Admin',
      description: 'Administration panel',
      icon: 'admin_panel_settings',
      url: 'https://admin.bake.ilia.to',
      color: '#2196f3',
    },
    {
      name: 'Kitchen',
      description: 'Kitchen display system',
      icon: 'restaurant',
      url: 'https://kitchen.bake.ilia.to',
      color: '#ff9800',
    },
    {
      name: 'Manager',
      description: 'Manager dashboard',
      icon: 'dashboard',
      url: 'https://manager.bake.ilia.to',
      color: '#9c27b0',
    },
  ],
  [UserRole.ACCOUNTANT]: [
    {
      name: 'Admin',
      description: 'Administration panel',
      icon: 'admin_panel_settings',
      url: 'https://admin.bake.ilia.to',
      color: '#2196f3',
    },
    {
      name: 'Manager',
      description: 'Manager dashboard',
      icon: 'dashboard',
      url: 'https://manager.bake.ilia.to',
      color: '#9c27b0',
    },
  ],
  [UserRole.CHEF]: [
    {
      name: 'Kitchen',
      description: 'Kitchen display system',
      icon: 'restaurant',
      url: 'https://kitchen.bake.ilia.to',
      color: '#ff9800',
    },
  ],
  [UserRole.BAKER]: [
    {
      name: 'Kitchen',
      description: 'Kitchen display system',
      icon: 'restaurant',
      url: 'https://kitchen.bake.ilia.to',
      color: '#ff9800',
    },
  ],
  [UserRole.BARISTA]: [
    {
      name: 'POS',
      description: 'Point of Sale terminal',
      icon: 'point_of_sale',
      url: 'https://pos.bake.ilia.to',
      color: '#4caf50',
    },
    {
      name: 'Kitchen',
      description: 'Kitchen display system',
      icon: 'restaurant',
      url: 'https://kitchen.bake.ilia.to',
      color: '#ff9800',
    },
  ],
  [UserRole.CASHIER]: [
    {
      name: 'POS',
      description: 'Point of Sale terminal',
      icon: 'point_of_sale',
      url: 'https://pos.bake.ilia.to',
      color: '#4caf50',
    },
    {
      name: 'Kitchen',
      description: 'Kitchen display system',
      icon: 'restaurant',
      url: 'https://kitchen.bake.ilia.to',
      color: '#ff9800',
    },
  ],
  [UserRole.WAREHOUSE]: [
    {
      name: 'Admin',
      description: 'Administration panel',
      icon: 'admin_panel_settings',
      url: 'https://admin.bake.ilia.to',
      color: '#2196f3',
    },
  ],
  [UserRole.MARKETING]: [
    {
      name: 'Admin',
      description: 'Administration panel',
      icon: 'admin_panel_settings',
      url: 'https://admin.bake.ilia.to',
      color: '#2196f3',
    },
  ],
};

@Component({
  selector: 'bake-app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="dashboard-container">
      <div class="welcome-section">
        <h1 class="welcome-title">Welcome, {{ userName }}</h1>
        <p class="welcome-subtitle">
          Role: <span class="role-badge">{{ userRole | uppercase }}</span>
        </p>
      </div>

      <div class="apps-grid">
        <a
          *ngFor="let app of apps"
          class="app-card"
          [href]="app.url + '?token=' + token"
        >
          <div class="app-icon-wrapper" [style.background-color]="app.color + '20'">
            <mat-icon [style.color]="app.color" class="app-icon">{{ app.icon }}</mat-icon>
          </div>
          <h3 class="app-name">{{ app.name }}</h3>
          <p class="app-description">{{ app.description }}</p>
          <mat-icon class="arrow-icon">arrow_forward</mat-icon>
        </a>
      </div>

      <div class="no-apps" *ngIf="apps.length === 0">
        <mat-icon class="no-apps-icon">block</mat-icon>
        <p>No applications available for your role.</p>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 40px 24px;
      }

      .welcome-section {
        margin-bottom: 40px;
      }

      .welcome-title {
        font-size: 28px;
        font-weight: 700;
        color: #3e2723;
        margin-bottom: 8px;
      }

      .welcome-subtitle {
        font-size: 15px;
        color: #6d4c41;
        margin: 0;
      }

      .role-badge {
        display: inline-block;
        background-color: #8b4513;
        color: #fff;
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .apps-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 20px;
      }

      .app-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 32px 24px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        text-decoration: none;
        color: inherit;
        transition: transform 0.2s, box-shadow 0.2s;
        position: relative;
        cursor: pointer;
      }

      .app-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(139, 69, 19, 0.15);
      }

      .app-icon-wrapper {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
      }

      .app-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .app-name {
        font-size: 18px;
        font-weight: 600;
        color: #3e2723;
        margin-bottom: 4px;
      }

      .app-description {
        font-size: 13px;
        color: #8d6e63;
        text-align: center;
        margin: 0;
      }

      .arrow-icon {
        position: absolute;
        top: 16px;
        right: 16px;
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #bdbdbd;
        transition: color 0.2s;
      }

      .app-card:hover .arrow-icon {
        color: #8b4513;
      }

      .no-apps {
        text-align: center;
        padding: 60px 20px;
        color: #8d6e63;
      }

      .no-apps-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #d7ccc8;
        margin-bottom: 16px;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  userName = '';
  userRole = '';
  token = '';
  apps: AppLink[] = [];

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    this.token = token || '';
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userName = payload.name || payload.email || 'User';
        this.userRole = payload.role?.name || payload.role || '';
        this.apps = ROLE_APP_MAP[this.userRole] || [];
      } catch {
        this.userName = 'User';
        this.apps = [];
      }
    }
  }
}
