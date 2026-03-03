import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@bake-app/auth';

@Component({
  selector: 'bake-app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="app-container">
      <mat-toolbar class="app-header" *ngIf="!isLoginPage">
        <mat-icon class="brand-icon">bakery_dining</mat-icon>
        <span class="brand-title">Bake App</span>
        <span class="spacer"></span>
        <button mat-button class="logout-btn" (click)="onLogout()">
          <mat-icon>exit_to_app</mat-icon>
          Logout
        </button>
      </mat-toolbar>

      <main class="app-content" [class.full-height]="isLoginPage">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .app-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }

      .app-header {
        background-color: #8b4513;
        color: #fff;
        padding: 0 16px;
        position: sticky;
        top: 0;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .brand-icon {
        margin-right: 8px;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .brand-title {
        font-size: 20px;
        font-weight: 700;
        font-family: 'Inter', sans-serif;
      }

      .spacer {
        flex: 1 1 auto;
      }

      .logout-btn {
        color: rgba(255, 255, 255, 0.85);
      }

      .logout-btn:hover {
        color: #fff;
        background-color: rgba(255, 255, 255, 0.1);
      }

      .app-content {
        flex: 1;
        overflow: auto;
      }

      .app-content.full-height {
        height: 100vh;
      }
    `,
  ],
})
export class AppComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  get isLoginPage(): boolean {
    return this.router.url === '/login' || this.router.url === '/';
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
