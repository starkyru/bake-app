import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Ingredient, Location } from '@bake-app/shared-types';

export interface AddInventoryDialogData {
  ingredients: Ingredient[];
  locations: Location[];
}

export interface AddInventoryDialogResult {
  ingredientId: string;
  locationId: string;
  quantity: number;
  unitCost?: number;
  batchNumber?: string;
  notes?: string;
}

@Component({
  selector: 'bake-add-inventory-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Add Inventory</h2>
    <mat-dialog-content>
      <div class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ingredient</mat-label>
          <mat-select [(ngModel)]="ingredientId" (selectionChange)="onIngredientChange()">
            <mat-option *ngFor="let ing of data.ingredients" [value]="ing.id">
              {{ ing.name }} ({{ ing.unit }})
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Location</mat-label>
          <mat-select [(ngModel)]="locationId">
            <mat-option *ngFor="let loc of data.locations" [value]="loc.id">
              {{ loc.name }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Quantity</mat-label>
            <input matInput type="number" [(ngModel)]="quantity" min="0.01" />
            <span matSuffix class="unit-suffix">{{ selectedUnit }}</span>
          </mat-form-field>

          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Unit Cost</mat-label>
            <input matInput type="number" [(ngModel)]="unitCost" min="0" />
          </mat-form-field>
        </div>

        <div class="info-row" *ngIf="selectedCalories != null">
          <mat-icon class="info-icon">local_fire_department</mat-icon>
          <span class="info-text">{{ selectedCalories }} cal per 100g</span>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Batch Number</mat-label>
          <input matInput [(ngModel)]="batchNumber" placeholder="Optional" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Notes</mat-label>
          <textarea matInput [(ngModel)]="notes" rows="2" placeholder="Optional"></textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button class="save-btn" [disabled]="!isValid()" (click)="onSubmit()">
        <mat-icon>add</mat-icon>
        Add
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 400px;
        padding-top: 8px;
      }
      .full-width {
        width: 100%;
      }
      .form-row {
        display: flex;
        gap: 12px;
      }
      .flex-1 {
        flex: 1;
      }
      .unit-suffix {
        padding-right: 8px;
        color: #78909c;
      }
      .info-row {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 0 8px;
        color: #5d4037;
        font-size: 13px;
      }
      .info-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #e65100;
      }
      .save-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
    `,
  ],
})
export class AddInventoryDialogComponent implements OnInit {
  ingredientId = '';
  locationId = '';
  quantity: number | null = null;
  unitCost: number | null = null;
  batchNumber = '';
  notes = '';

  selectedUnit = '';
  selectedCalories: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<AddInventoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddInventoryDialogData,
  ) {}

  ngOnInit(): void {
    if (this.data.locations.length === 1) {
      this.locationId = this.data.locations[0].id;
    }
  }

  onIngredientChange(): void {
    const ing = this.data.ingredients.find((i) => i.id === this.ingredientId);
    if (ing) {
      this.selectedUnit = ing.unit;
      this.selectedCalories = ing.calories != null ? Number(ing.calories) : null;
    } else {
      this.selectedUnit = '';
      this.selectedCalories = null;
    }
  }

  isValid(): boolean {
    return !!this.ingredientId && !!this.locationId && !!this.quantity && this.quantity > 0;
  }

  onSubmit(): void {
    if (!this.isValid()) return;
    const result: AddInventoryDialogResult = {
      ingredientId: this.ingredientId,
      locationId: this.locationId,
      quantity: this.quantity!,
      unitCost: this.unitCost ?? undefined,
      batchNumber: this.batchNumber || undefined,
      notes: this.notes || undefined,
    };
    this.dialogRef.close(result);
  }
}
