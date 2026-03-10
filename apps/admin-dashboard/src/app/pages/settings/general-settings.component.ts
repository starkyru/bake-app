import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BakeToastService } from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';

@Component({
  selector: 'bake-general-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="settings-form">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Bakery Name</mat-label>
        <input matInput [(ngModel)]="general.bakeryName" placeholder="My Bakery" />
        <mat-icon matPrefix>storefront</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Address</mat-label>
        <textarea
          matInput
          [(ngModel)]="general.address"
          rows="2"
          placeholder="Full bakery address"
        ></textarea>
        <mat-icon matPrefix>location_on</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Phone Number</mat-label>
        <input matInput [(ngModel)]="general.phone" placeholder="+7 (7xx) xxx-xx-xx" />
        <mat-icon matPrefix>phone</mat-icon>
      </mat-form-field>

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
export class GeneralSettingsComponent implements OnInit {
  general = {
    bakeryName: '',
    address: '',
    phone: '',
  };

  constructor(
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.apiClient.get<Record<string, unknown>>('/v1/settings/general').subscribe({
      next: (settings) => {
        if (settings && Object.keys(settings).length) {
          this.general = {
            bakeryName: (settings['bakeryName'] as string) || this.general.bakeryName,
            address: (settings['address'] as string) || this.general.address,
            phone: (settings['phone'] as string) || this.general.phone,
          };
        }
      },
      error: () => this.toastService.error('Failed to load general settings'),
    });
  }

  onSave(): void {
    this.apiClient
      .put('/v1/settings/general', {
        bakeryName: this.general.bakeryName,
        address: this.general.address,
        phone: this.general.phone,
      })
      .subscribe({
        next: () => this.toastService.success('General settings saved successfully'),
        error: () => this.toastService.error('Failed to save general settings'),
      });
  }
}
