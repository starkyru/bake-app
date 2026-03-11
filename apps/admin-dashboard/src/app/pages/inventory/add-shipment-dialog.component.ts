import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

export interface AddShipmentDialogData {
  packages: { id: string; size: number; unit: string }[];
  locations: { id: string; name: string }[];
}

export interface AddShipmentDialogResult {
  packageId: string;
  packageCount: number;
  locationId: string;
  unitCost?: number;
  batchNumber?: string;
  notes?: string;
}

@Component({
  selector: 'bake-app-add-shipment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Add Shipment</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Package Type</mat-label>
        <mat-select [(ngModel)]="form.packageId">
          <mat-option *ngFor="let pkg of data.packages" [value]="pkg.id">
            {{ pkg.size }} {{ pkg.unit }}
          </mat-option>
        </mat-select>
        <mat-error *ngIf="errors.packageId">{{ errors.packageId }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Amount (number of packages)</mat-label>
        <input matInput type="number" [(ngModel)]="form.packageCount" min="1" />
        <mat-error *ngIf="errors.packageCount">{{ errors.packageCount }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Location</mat-label>
        <mat-select [(ngModel)]="form.locationId">
          <mat-option *ngFor="let loc of data.locations" [value]="loc.id">
            {{ loc.name }}
          </mat-option>
        </mat-select>
        <mat-error *ngIf="errors.locationId">{{ errors.locationId }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Unit Cost (optional)</mat-label>
        <input matInput type="number" [(ngModel)]="form.unitCost" min="0" step="0.01" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Batch Number (optional)</mat-label>
        <input matInput [(ngModel)]="form.batchNumber" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Notes (optional)</mat-label>
        <textarea matInput [(ngModel)]="form.notes" rows="2"></textarea>
      </mat-form-field>

      <div class="error-list" *ngIf="hasErrors">
        <div class="error-msg" *ngIf="errors.packageId">{{ errors.packageId }}</div>
        <div class="error-msg" *ngIf="errors.packageCount">{{ errors.packageCount }}</div>
        <div class="error-msg" *ngIf="errors.locationId">{{ errors.locationId }}</div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button class="submit-btn" (click)="submit()">
        Add Shipment
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }
      mat-dialog-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 400px;
      }
      .submit-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
      .error-list {
        margin-bottom: 8px;
      }
      .error-msg {
        color: #c62828;
        font-size: 12px;
        margin-bottom: 4px;
      }
    `,
  ],
})
export class AddShipmentDialogComponent {
  form = {
    packageId: '',
    packageCount: null as number | null,
    locationId: '',
    unitCost: null as number | null,
    batchNumber: '',
    notes: '',
  };

  errors: { packageId?: string; packageCount?: string; locationId?: string } = {};

  get hasErrors(): boolean {
    return !!(this.errors.packageId || this.errors.packageCount || this.errors.locationId);
  }

  constructor(
    private dialogRef: MatDialogRef<AddShipmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddShipmentDialogData,
  ) {}

  submit(): void {
    this.errors = {};

    if (!this.form.packageId) {
      this.errors.packageId = 'Package type is required';
    }
    if (!this.form.packageCount || this.form.packageCount <= 0) {
      this.errors.packageCount = 'Amount is required and must be greater than 0';
    }
    if (!this.form.locationId) {
      this.errors.locationId = 'Location is required';
    }

    if (this.hasErrors) return;

    const result: AddShipmentDialogResult = {
      packageId: this.form.packageId,
      packageCount: this.form.packageCount!,
      locationId: this.form.locationId,
    };
    if (this.form.unitCost) result.unitCost = this.form.unitCost;
    if (this.form.batchNumber) result.batchNumber = this.form.batchNumber;
    if (this.form.notes) result.notes = this.form.notes;

    this.dialogRef.close(result);
  }
}
