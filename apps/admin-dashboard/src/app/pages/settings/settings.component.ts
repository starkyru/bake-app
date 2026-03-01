import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { BakePageContainerComponent, BakeToastService } from '@bake-app/ui-components';

@Component({
  selector: 'bake-app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    BakePageContainerComponent,
  ],
  template: `
    <bake-page-container title="Settings" subtitle="Configure your bakery system">
      <mat-accordion class="settings-accordion" multi>
        <!-- General Settings -->
        <mat-expansion-panel expanded>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon class="panel-icon">store</mat-icon>
              General Settings
            </mat-panel-title>
            <mat-panel-description>
              Bakery name, address, and contact info
            </mat-panel-description>
          </mat-expansion-panel-header>

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
              <button mat-flat-button class="save-btn" (click)="onSaveGeneral()">
                <mat-icon>save</mat-icon>
                Save Changes
              </button>
            </div>
          </div>
        </mat-expansion-panel>

        <!-- Tax Configuration -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon class="panel-icon">receipt</mat-icon>
              Tax Configuration
            </mat-panel-title>
            <mat-panel-description>
              Tax rates and calculation settings
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="settings-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tax Name</mat-label>
              <input matInput [(ngModel)]="tax.name" placeholder="VAT" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tax Rate (%)</mat-label>
              <input
                matInput
                type="number"
                [(ngModel)]="tax.rate"
                placeholder="12"
              />
              <span matSuffix>%</span>
            </mat-form-field>

            <mat-slide-toggle
              [(ngModel)]="tax.included"
              color="primary"
              class="toggle-field"
            >
              Tax included in displayed prices
            </mat-slide-toggle>

            <div class="form-actions">
              <button mat-flat-button class="save-btn" (click)="onSaveTax()">
                <mat-icon>save</mat-icon>
                Save Changes
              </button>
            </div>
          </div>
        </mat-expansion-panel>

        <!-- POS Settings -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon class="panel-icon">point_of_sale</mat-icon>
              POS Settings
            </mat-panel-title>
            <mat-panel-description>
              Receipt and point-of-sale configuration
            </mat-panel-description>
          </mat-expansion-panel-header>

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

            <mat-slide-toggle
              [(ngModel)]="pos.autoPrint"
              color="primary"
              class="toggle-field"
            >
              Auto-print receipt after order completion
            </mat-slide-toggle>

            <div class="form-actions">
              <button mat-flat-button class="save-btn" (click)="onSavePos()">
                <mat-icon>save</mat-icon>
                Save Changes
              </button>
            </div>
          </div>
        </mat-expansion-panel>
      </mat-accordion>
    </bake-page-container>
  `,
  styles: [
    `
      .settings-accordion {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 700px;
      }

      ::ng-deep .settings-accordion .mat-expansion-panel {
        border-radius: 12px !important;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
      }

      .panel-icon {
        margin-right: 12px;
        color: #8b4513;
      }

      ::ng-deep .mat-expansion-panel-header-title {
        align-items: center;
        font-weight: 600;
        color: #3e2723;
      }

      ::ng-deep .mat-expansion-panel-header-description {
        align-items: center;
        color: #8d6e63;
      }

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
export class SettingsComponent {
  general = {
    bakeryName: 'Sweet Bake Almaty',
    address: 'ul. Abaya 52, Almaty, Kazakhstan 050000',
    phone: '+7 (727) 123-45-67',
  };

  tax = {
    name: 'VAT',
    rate: 12,
    included: true,
  };

  pos = {
    receiptHeader: 'Sweet Bake Almaty\nul. Abaya 52\nTel: +7 (727) 123-45-67\nThank you for your visit!',
    autoPrint: true,
  };

  constructor(private toastService: BakeToastService) {}

  onSaveGeneral(): void {
    this.toastService.success('General settings saved successfully');
  }

  onSaveTax(): void {
    this.toastService.success('Tax configuration saved successfully');
  }

  onSavePos(): void {
    this.toastService.success('POS settings saved successfully');
  }
}
