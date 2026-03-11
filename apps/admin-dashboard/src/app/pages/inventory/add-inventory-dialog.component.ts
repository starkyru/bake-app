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
import { MatTooltipModule } from '@angular/material/tooltip';
import { Ingredient, InventoryItem, UNIT_GROUPS } from '@bake-app/shared-types';

export interface AddInventoryDialogData {
  ingredients: Ingredient[];
  mode: 'create' | 'edit';
  item?: InventoryItem;
}

export interface AddInventoryDialogResult {
  title: string;
  ingredientId: string;
  packages: { size: number; unit: string }[];
  minStockLevel?: number;
  minStockUnit?: string;
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
    MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Edit Inventory Item' : 'Add Inventory Item' }}</h2>
    <mat-dialog-content>
      <div class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput [(ngModel)]="title" placeholder="e.g., King Arthur Flour" />
          <mat-error *ngIf="submitted && !title">Title is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ingredient</mat-label>
          <mat-select
            [(ngModel)]="ingredientId"
            (selectionChange)="onIngredientChange()"
            [disabled]="isEdit"
          >
            <mat-option *ngFor="let ing of data.ingredients" [value]="ing.id">
              {{ ing.name }} ({{ ing.unit }})
            </mat-option>
          </mat-select>
          <mat-error *ngIf="submitted && !ingredientId">Select an ingredient</mat-error>
        </mat-form-field>

        <div class="section-label">Warn when level below</div>
        <div class="form-row">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Level</mat-label>
            <input matInput type="number" [(ngModel)]="minStockLevel" min="0" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Unit</mat-label>
            <mat-select [(ngModel)]="minStockUnit">
              <mat-option *ngFor="let u of availableUnits" [value]="u">
                {{ u }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="section-label">Package Sizes</div>
        <div class="packages-list">
          <div class="package-row-wrapper" *ngFor="let pkg of packages; let i = index">
            <div class="form-row">
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Size</mat-label>
                <input matInput type="number" [(ngModel)]="pkg.size" min="0.01" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Unit</mat-label>
                <mat-select [(ngModel)]="pkg.unit">
                  <mat-option *ngFor="let u of availableUnits" [value]="u">
                    {{ u }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <button
                mat-icon-button
                color="warn"
                (click)="removePackage(i)"
                *ngIf="packages.length > 1 && !pkg.hasShipments"
                class="remove-btn"
              >
                <mat-icon>close</mat-icon>
              </button>
              <button
                mat-icon-button
                disabled
                *ngIf="packages.length > 1 && pkg.hasShipments"
                class="remove-btn"
                matTooltip="Cannot remove — this package has shipments"
              >
                <mat-icon>lock</mat-icon>
              </button>
            </div>
            <mat-error class="field-error" *ngIf="submitted && (!pkg.size || pkg.size <= 0)">
              Package size must be greater than 0
            </mat-error>
            <mat-error class="field-error" *ngIf="submitted && pkg.size && pkg.size > 0 && !pkg.unit">
              Select a unit
            </mat-error>
          </div>
        </div>
        <button mat-stroked-button class="add-package-btn" (click)="addPackage()">
          <mat-icon>add</mat-icon>
          Add Package Size
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancel</button>
      <button mat-flat-button class="save-btn" (click)="onSubmit()">
        <mat-icon>{{ isEdit ? 'save' : 'add' }}</mat-icon>
        {{ isEdit ? 'Save' : 'Add' }}
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
        align-items: flex-start;
      }
      .flex-1 {
        flex: 1;
      }
      .section-label {
        font-size: 13px;
        font-weight: 500;
        color: #5d4037;
        margin: 4px 0 8px;
      }
      .packages-list {
        display: flex;
        flex-direction: column;
        gap: 0;
      }
      .remove-btn {
        margin-top: 8px;
      }
      .add-package-btn {
        align-self: flex-start;
        margin-bottom: 8px;
        border-color: #8b4513 !important;
        color: #8b4513 !important;
      }
      .save-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
      .field-error {
        font-size: 12px;
        margin-top: -16px;
        margin-bottom: 8px;
        padding-left: 16px;
      }
    `,
  ],
})
export class AddInventoryDialogComponent implements OnInit {
  title = '';
  ingredientId = '';
  minStockLevel: number | null = null;
  minStockUnit = '';
  packages: { size: number | null; unit: string; hasShipments?: boolean }[] = [{ size: null, unit: '' }];
  availableUnits: string[] = [];
  submitted = false;

  get isEdit(): boolean {
    return this.data.mode === 'edit';
  }

  constructor(
    public dialogRef: MatDialogRef<AddInventoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddInventoryDialogData,
  ) {}

  ngOnInit(): void {
    if (this.isEdit && this.data.item) {
      const item = this.data.item;
      this.title = item.title;
      this.ingredientId = item.ingredientId;
      this.minStockLevel = item.minStockLevel != null ? Number(item.minStockLevel) : null;
      this.minStockUnit = item.minStockUnit || '';

      // Set available units from ingredient
      this.onIngredientChange();

      if (item.packages?.length) {
        this.packages = item.packages.map((p: any) => ({
          size: p.size,
          unit: p.unit,
          hasShipments: p.hasShipments || false,
        }));
      }

      // Set minStockUnit default if not set
      if (!this.minStockUnit && this.availableUnits.length) {
        this.minStockUnit = this.availableUnits[0];
      }
    }
  }

  onIngredientChange(): void {
    const ing = this.data.ingredients.find((i) => i.id === this.ingredientId);
    if (ing) {
      this.availableUnits = UNIT_GROUPS[ing.unit] || [ing.unit];
      // Reset units if they don't match new ingredient
      for (const pkg of this.packages) {
        if (!this.availableUnits.includes(pkg.unit)) {
          pkg.unit = this.availableUnits[0] || '';
        }
      }
      if (!this.availableUnits.includes(this.minStockUnit)) {
        this.minStockUnit = this.availableUnits[0] || '';
      }
    } else {
      this.availableUnits = [];
    }
  }

  addPackage(): void {
    this.packages.push({ size: null, unit: this.availableUnits[0] || '' });
  }

  removePackage(index: number): void {
    this.packages.splice(index, 1);
  }

  isValid(): boolean {
    return (
      !!this.title &&
      !!this.ingredientId &&
      this.packages.length > 0 &&
      this.packages.every((p) => p.size && p.size > 0 && !!p.unit)
    );
  }

  onSubmit(): void {
    this.submitted = true;
    if (!this.isValid()) return;
    const result: AddInventoryDialogResult = {
      title: this.title,
      ingredientId: this.ingredientId,
      packages: this.packages
        .filter((p) => p.size && p.size > 0 && p.unit)
        .map((p) => ({ size: p.size!, unit: p.unit })),
      minStockLevel: this.minStockLevel != null && this.minStockLevel > 0
        ? this.minStockLevel
        : undefined,
      minStockUnit: this.minStockLevel != null && this.minStockLevel > 0
        ? this.minStockUnit
        : undefined,
    };
    this.dialogRef.close(result);
  }
}
