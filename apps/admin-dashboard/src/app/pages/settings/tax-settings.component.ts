import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BakeToastService } from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';

@Component({
  selector: 'bake-tax-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="settings-form">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Tax Name</mat-label>
        <input matInput [(ngModel)]="tax.name" placeholder="Tax name" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Tax Rate, %</mat-label>
        <input
              matInput
              type="text"
              inputmode="decimal"
              [(ngModel)]="tax.rate"
              placeholder="Tax percentage"
              (keydown)="filterKey($event)"
            />
      </mat-form-field>

      <mat-slide-toggle [(ngModel)]="tax.included" color="primary" class="toggle-field">
        Tax included in displayed prices
      </mat-slide-toggle>

      <div class="form-actions">
        <button mat-flat-button class="save-btn" (click)="onSave()">
          <mat-icon>save</mat-icon>
          Save Changes
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .settings-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 0;
      }
      .full-width {
        width: 100%;
      }
      .toggle-field {
        margin: 8px 0 16px;
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
      }
      .save-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
    `,
  ],
})
export class TaxSettingsComponent implements OnInit {
  tax = {
    name: 'VAT',
    rate: 12,
    included: true,
  };

  constructor(
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.apiClient.get<Record<string, unknown>>('/v1/settings/tax').subscribe({
      next: (settings) => {
        if (settings && Object.keys(settings).length) {
          this.tax = {
            name: (settings['taxName'] as string) || this.tax.name,
            rate: (settings['taxRate'] as number) ?? this.tax.rate,
            included:
              settings['taxInclusive'] != null
                ? (settings['taxInclusive'] as boolean)
                : this.tax.included,
          };
        }
      },
      error: () => this.toastService.error('Failed to load tax settings'),
    });
  }

  filterKey(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];
    if (allowed.includes(event.key)) return;
    if (event.key === '.' && !String(this.tax.rate).includes('.')) return;
    if (event.key >= '0' && event.key <= '9') return;
    event.preventDefault();
  }

  onSave(): void {
    this.apiClient
      .put('/v1/settings/tax', {
        taxName: this.tax.name,
        taxRate: this.tax.rate,
        taxInclusive: this.tax.included,
      })
      .subscribe({
        next: () => this.toastService.success('Tax configuration saved successfully'),
        error: () => this.toastService.error('Failed to save tax configuration'),
      });
  }
}
