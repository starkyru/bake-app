import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'bake-button',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <button
      [attr.type]="type"
      [disabled]="disabled || loading"
      [class]="'bake-btn bake-btn-' + size"
      [ngClass]="{
        'mat-mdc-raised-button': variant === 'primary' || variant === 'accent' || variant === 'warn',
        'mat-mdc-outlined-button': variant === 'secondary',
        'mat-mdc-button': variant === 'text'
      }"
      [color]="variant === 'secondary' || variant === 'text' ? undefined : variant === 'accent' ? 'accent' : variant === 'warn' ? 'warn' : 'primary'"
      mat-raised-button
    >
      <mat-spinner *ngIf="loading" [diameter]="spinnerSize" class="btn-spinner"></mat-spinner>
      <mat-icon *ngIf="icon && !loading">{{icon}}</mat-icon>
      <span class="btn-label" [class.hidden]="loading">
        <ng-content></ng-content>
      </span>
    </button>
  `,
  styles: [`
    :host { display: inline-block; }
    .bake-btn { display: inline-flex; align-items: center; gap: 8px; }
    .bake-btn-small { font-size: 12px; padding: 4px 12px; }
    .bake-btn-medium { font-size: 14px; padding: 8px 16px; }
    .bake-btn-large { font-size: 16px; padding: 12px 24px; min-height: 48px; }
    .btn-spinner { margin-right: 8px; }
    .hidden { visibility: hidden; width: 0; overflow: hidden; }
  `],
})
export class BakeButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'accent' | 'warn' | 'text' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() icon = '';

  get spinnerSize(): number {
    return this.size === 'small' ? 16 : this.size === 'large' ? 24 : 20;
  }
}
