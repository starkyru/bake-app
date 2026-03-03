import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
    ReactiveFormsModule,
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
          <mat-icon class="brand-icon">bakery_dining</mat-icon>
          <h1 class="brand-title">Bake POS</h1>
          <p class="brand-subtitle">Sign in to your account</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input
              matInput
              type="email"
              formControlName="email"
              placeholder="your@email.com"
            />
            <mat-icon matPrefix>email</mat-icon>
            <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
              Email is required
            </mat-error>
            <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
              Please enter a valid email
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input
              matInput
              [type]="hidePassword ? 'password' : 'text'"
              formControlName="password"
              placeholder="Enter your password"
            />
            <mat-icon matPrefix>lock</mat-icon>
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="hidePassword = !hidePassword"
            >
              <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
              Password is required
            </mat-error>
          </mat-form-field>

          <div class="error-message" *ngIf="errorMessage">
            <mat-icon>error</mat-icon>
            {{ errorMessage }}
          </div>

          <button
            mat-flat-button
            class="sign-in-btn"
            type="submit"
            [disabled]="loginForm.invalid || isLoading"
          >
            <mat-spinner
              *ngIf="isLoading"
              diameter="20"
              class="btn-spinner"
            ></mat-spinner>
            <span *ngIf="!isLoading">Sign In</span>
          </button>
        </form>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background-color: #faf3e8;
        padding: 16px;
      }

      .login-card {
        width: 100%;
        max-width: 420px;
        padding: 40px 32px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(139, 69, 19, 0.12);
      }

      .login-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .brand-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: #8b4513;
        margin-bottom: 8px;
      }

      .brand-title {
        font-size: 28px;
        font-weight: 700;
        color: #8b4513;
        margin-bottom: 4px;
        font-family: 'Inter', sans-serif;
      }

      .brand-subtitle {
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

      .sign-in-btn {
        width: 100%;
        height: 48px;
        background-color: #8b4513 !important;
        color: #fff !important;
        font-size: 16px;
        font-weight: 600;
        border-radius: 8px;
        margin-top: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sign-in-btn:disabled {
        opacity: 0.6;
      }

      .btn-spinner {
        display: inline-block;
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #c62828;
        font-size: 13px;
        padding: 8px 12px;
        background-color: #ffebee;
        border-radius: 6px;
        margin-bottom: 8px;
      }

      .error-message mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `,
  ],
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.accessToken ?? '');
        this.isLoading = false;
        this.router.navigate(['/pos']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage =
          err.error?.message || 'Login failed. Please check your credentials.';
      },
    });
  }
}
