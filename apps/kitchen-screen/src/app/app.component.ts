import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'bake-app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <div class="kitchen-shell">
      <header class="kitchen-header">
        <div class="header-left">
          <mat-icon class="header-logo">restaurant</mat-icon>
          <h1 class="header-title">Kitchen Display</h1>
        </div>

        <nav class="header-nav">
          <a
            class="nav-tab"
            routerLink="/queue"
            routerLinkActive="nav-tab--active"
          >
            <mat-icon>view_column</mat-icon>
            <span>Queue</span>
          </a>
          <a
            class="nav-tab"
            routerLink="/production"
            routerLinkActive="nav-tab--active"
          >
            <mat-icon>factory</mat-icon>
            <span>Production</span>
          </a>
        </nav>

        <div class="header-right">
          <div class="active-orders">
            <mat-icon>receipt_long</mat-icon>
            <span class="orders-count">{{ activeOrdersCount }}</span>
            <span class="orders-label">Active</span>
          </div>
          <div class="live-clock">{{ currentTime }}</div>
        </div>
      </header>

      <main class="kitchen-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      background-color: #1A1A2E;
      color: #FFFFFF;
      font-family: 'Inter', sans-serif;
    }

    .kitchen-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    .kitchen-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      height: 64px;
      min-height: 64px;
      background-color: #0F0F23;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-logo {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #FFB74D;
    }

    .header-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      color: #FFFFFF;
      letter-spacing: -0.3px;
    }

    .header-nav {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .nav-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 24px;
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.6);
      text-decoration: none;
      font-size: 15px;
      font-weight: 500;
      transition: all 0.2s ease;
      min-height: 44px;
    }

    .nav-tab:hover {
      color: rgba(255, 255, 255, 0.85);
      background-color: rgba(255, 255, 255, 0.06);
    }

    .nav-tab--active {
      color: #FFFFFF;
      background-color: rgba(255, 255, 255, 0.1);
    }

    .nav-tab mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .active-orders {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background-color: rgba(255, 183, 77, 0.12);
      border: 1px solid rgba(255, 183, 77, 0.25);
      border-radius: 8px;
      color: #FFB74D;
      font-size: 14px;
      font-weight: 500;
    }

    .active-orders mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .orders-count {
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      font-weight: 700;
    }

    .orders-label {
      color: rgba(255, 183, 77, 0.7);
      font-size: 13px;
    }

    .live-clock {
      font-family: 'JetBrains Mono', monospace;
      font-size: 22px;
      font-weight: 500;
      color: #FFFFFF;
      letter-spacing: 1px;
      min-width: 90px;
      text-align: right;
    }

    .kitchen-content {
      flex: 1;
      overflow: hidden;
      background-color: #1A1A2E;
    }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'kitchen-screen';
  currentTime = '';
  activeOrdersCount = 7;

  private clockInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }
}
