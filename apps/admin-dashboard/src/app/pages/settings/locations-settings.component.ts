import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { BakeConfirmationService, BakeToastService } from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { Location } from '@bake-app/shared-types';

@Component({
  selector: 'bake-locations-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatProgressBarModule,
    MatChipsModule,
  ],
  template: `
    <mat-progress-bar *ngIf="loading" mode="indeterminate" class="settings-loading"></mat-progress-bar>
    <div class="location-layout">
      <div class="location-form-section">
        <div class="section-title">
          {{ editing ? 'Edit Location' : 'Add Location' }}
        </div>
        <form (ngSubmit)="onSave()" class="form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Name</mat-label>
            <input
              matInput
              [(ngModel)]="formName"
              name="name"
              placeholder="e.g., Main Bakery"
            />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Address</mat-label>
            <input
              matInput
              [(ngModel)]="formAddress"
              name="address"
              placeholder="e.g., 742 Elmwood Dr, Charlotte, NC"
            />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Phone</mat-label>
            <input
              matInput
              [(ngModel)]="formPhone"
              name="phone"
              placeholder="e.g., +1 (555) 555-5555"
            />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Type</mat-label>
            <mat-select [(ngModel)]="formType" name="type">
              <mat-option value="production">Production</mat-option>
              <mat-option value="retail">Retail</mat-option>
              <mat-option value="warehouse">Warehouse</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="form-actions">
            <button mat-button type="button" *ngIf="editing" (click)="cancelEdit()">
              Cancel
            </button>
            <button mat-flat-button type="submit" class="save-btn">
              {{ editing ? 'Update' : 'Add' }}
            </button>
          </div>
        </form>
      </div>

      <mat-divider [vertical]="true" class="location-divider"></mat-divider>

      <div class="location-list-section">
        <mat-nav-list class="location-list">
          <mat-list-item *ngFor="let loc of locations" class="parent-item">
            <mat-icon matListItemIcon class="location-icon">
              {{ typeIcon(loc.type) }}
            </mat-icon>
            <span matListItemTitle class="location-name">{{ loc.name }}</span>
            <span matListItemLine class="location-detail">
              {{ loc.address || 'No address' }}
              <span *ngIf="loc.phone"> &middot; {{ loc.phone }}</span>
            </span>
            <div matListItemMeta class="item-actions">
              <span class="type-chip" [class]="'chip-' + loc.type">{{ loc.type }}</span>
              <button mat-icon-button (click)="onEdit(loc)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="onDelete(loc)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </mat-list-item>
          <div *ngIf="locations.length === 0" class="empty-state">
            No locations yet.
          </div>
        </mat-nav-list>
      </div>
    </div>
  `,
  styles: [
    `
      .location-layout {
        display: grid;
        grid-template-columns: 300px auto 1fr;
        gap: 0;
        align-items: start;
        min-height: 200px;
      }
      .location-form-section {
        padding-right: 24px;
      }
      .location-divider {
        height: 100%;
      }
      .location-list-section {
        padding-left: 24px;
      }
      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #3e2723;
        margin-bottom: 12px;
      }
      .form {
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
        gap: 8px;
        margin-top: 8px;
      }
      .save-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
      .location-list {
        padding: 0;
      }
      .parent-item {
        font-weight: 500;
      }
      .location-icon {
        color: #8b4513;
      }
      .location-name {
        font-weight: 500;
        color: #3e2723;
      }
      .location-detail {
        font-size: 12px;
        color: #78909c;
      }
      .item-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .type-chip {
        font-size: 11px;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 12px;
        text-transform: capitalize;
      }
      .chip-production {
        background-color: #e8f5e9;
        color: #2e7d32;
      }
      .chip-retail {
        background-color: #e3f2fd;
        color: #1565c0;
      }
      .chip-warehouse {
        background-color: #fff3e0;
        color: #e65100;
      }
      .empty-state {
        text-align: center;
        color: #9e9e9e;
        padding: 24px;
        font-style: italic;
      }
      .settings-loading {
        margin-bottom: 8px;
      }
      @media (max-width: 768px) {
        .location-layout {
          grid-template-columns: 1fr;
        }
        .location-divider {
          display: none;
        }
        .location-form-section {
          padding-right: 0;
        }
        .location-list-section {
          padding-left: 0;
        }
      }
    `,
  ],
})
export class LocationsSettingsComponent implements OnInit {
  loading = false;
  locations: Location[] = [];
  formName = '';
  formAddress = '';
  formPhone = '';
  formType = 'retail';
  editing: Location | null = null;

  constructor(
    private toastService: BakeToastService,
    private confirmService: BakeConfirmationService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  typeIcon(type: string): string {
    switch (type) {
      case 'production':
        return 'bakery_dining';
      case 'warehouse':
        return 'warehouse';
      default:
        return 'storefront';
    }
  }

  private load(): void {
    this.loading = true;
    this.apiClient.get<Location[]>('/v1/locations').subscribe({
      next: (locs) => {
        this.loading = false;
        this.locations = locs;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Failed to load locations');
      },
    });
  }

  onSave(): void {
    if (!this.formName.trim()) return;

    const dto = {
      name: this.formName,
      address: this.formAddress || undefined,
      phone: this.formPhone || undefined,
      type: this.formType,
    };

    if (this.editing) {
      this.apiClient
        .put<Location>(`/v1/locations/${this.editing.id}`, dto)
        .subscribe({
          next: (updated) => {
            this.locations = this.locations.map((l) =>
              l.id === this.editing!.id ? updated : l,
            );
            this.toastService.success('Location updated');
            this.cancelEdit();
          },
          error: () => this.toastService.error('Failed to update location'),
        });
    } else {
      this.apiClient.post<Location>('/v1/locations', dto).subscribe({
        next: (created) => {
          this.locations = [...this.locations, created];
          this.toastService.success('Location created');
          this.resetForm();
        },
        error: () => this.toastService.error('Failed to create location'),
      });
    }
  }

  onEdit(location: Location): void {
    this.editing = location;
    this.formName = location.name;
    this.formAddress = location.address || '';
    this.formPhone = location.phone || '';
    this.formType = location.type;
  }

  cancelEdit(): void {
    this.editing = null;
    this.resetForm();
  }

  private resetForm(): void {
    this.formName = '';
    this.formAddress = '';
    this.formPhone = '';
    this.formType = 'retail';
  }

  onDelete(location: Location): void {
    this.confirmService
      .confirm({
        title: 'Delete Location',
        message: `Are you sure you want to delete "${location.name}"? This will fail if the location has inventory items.`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.apiClient.delete(`/v1/locations/${location.id}`).subscribe({
            next: () => {
              this.locations = this.locations.filter((l) => l.id !== location.id);
              this.toastService.success('Location deleted');
              if (this.editing?.id === location.id) {
                this.cancelEdit();
              }
            },
            error: () =>
              this.toastService.error(
                'Failed to delete location. It may have inventory items.',
              ),
          });
        }
      });
  }
}
