import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@bake-app/auth';

@Component({
  selector: 'bake-app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <div class="login-header">
          <mat-icon class="login-logo">bakery_dining</mat-icon>
          <h1 class="login-title">Bake Admin</h1>
          <p class="login-subtitle">Sign in to the admin dashboard</p>
        </div>

        <mat-card-content>
          <form (ngSubmit)="onLogin()" class="login-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                [(ngModel)]="email"
                name="email"
                placeholder="admin@bakery.com"
                required
              />
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="hidePassword ? 'password' : 'text'"
                [(ngModel)]="password"
                name="password"
                placeholder="Enter password"
                required
              />
              <mat-icon matPrefix>lock</mat-icon>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hidePassword = !hidePassword"
              >
                <mat-icon>{{
                  hidePassword ? 'visibility_off' : 'visibility'
                }}</mat-icon>
              </button>
            </mat-form-field>

            <p class="error-message" *ngIf="errorMessage">{{ errorMessage }}</p>

            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="login-button full-width"
              [disabled]="loading"
            >
              <mat-spinner
                *ngIf="loading"
                diameter="20"
                class="spinner"
              ></mat-spinner>
              <span *ngIf="!loading">Sign In</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #faf3e8 0%, #d4a574 100%);
      }

      .login-card {
        width: 100%;
        max-width: 420px;
        padding: 40px 32px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(139, 69, 19, 0.15);
      }

      .login-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .login-logo {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: #8b4513;
        margin-bottom: 12px;
      }

      .login-title {
        font-size: 28px;
        font-weight: 700;
        color: #8b4513;
        margin: 0 0 4px;
      }

      .login-subtitle {
        font-size: 14px;
        color: #8d6e63;
        margin: 0;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .full-width {
        width: 100%;
      }

      .login-button {
        height: 48px;
        font-size: 16px;
        font-weight: 600;
        background-color: #8b4513 !important;
        color: #ffffff !important;
        border-radius: 8px;
        margin-top: 8px;
      }

      .login-button:hover:not([disabled]) {
        background-color: #6d3410 !important;
      }

      .error-message {
        color: #c62828;
        font-size: 13px;
        text-align: center;
        margin: 0 0 8px;
      }

      .spinner {
        display: inline-block;
      }

      ::ng-deep .login-button .mat-mdc-progress-spinner circle {
        stroke: #ffffff !important;
      }
    `,
  ],
})
export class LoginComponent {
  email = '';
  password = '';
  hidePassword = true;
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/users']);
    }
  }

  onLogin(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        this.authService.setToken(response.accessToken ?? '');
        this.loading = false;
        this.router.navigate(['/users']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.error?.message || 'Invalid credentials. Please try again.';
      },
    });
  }
}
