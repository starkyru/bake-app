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
  selector: 'bake-pos-settings',
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
        <mat-label>Receipt Header</mat-label>
        <textarea
          matInput
          [(ngModel)]="pos.receiptHeader"
          rows="3"
          placeholder="Text displayed at the top of receipts"
        ></textarea>
      </mat-form-field>

      <mat-slide-toggle [(ngModel)]="pos.autoPrint" color="primary" class="toggle-field">
        Auto-print receipt after order completion
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
export class PosSettingsComponent implements OnInit {
  pos = {
    receiptHeader:
      'Sweet Bake Almaty\nul. Abaya 52\nTel: +7 (727) 123-45-67\nThank you for your visit!',
    autoPrint: true,
  };

  constructor(
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.apiClient.get<Record<string, unknown>>('/v1/settings/pos').subscribe({
      next: (settings) => {
        if (settings && Object.keys(settings).length) {
          this.pos = {
            receiptHeader:
              (settings['receiptHeader'] as string) || this.pos.receiptHeader,
            autoPrint:
              settings['autoPrint'] != null
                ? (settings['autoPrint'] as boolean)
                : this.pos.autoPrint,
          };
        }
      },
      error: () => this.toastService.error('Failed to load POS settings'),
    });
  }

  onSave(): void {
    this.apiClient
      .put('/v1/settings/pos', {
        receiptHeader: this.pos.receiptHeader,
        autoPrint: this.pos.autoPrint,
      })
      .subscribe({
        next: () => this.toastService.success('POS settings saved successfully'),
        error: () => this.toastService.error('Failed to save POS settings'),
      });
  }
}
