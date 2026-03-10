import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiClientService } from '@bake-app/api-client';
import { Category } from '@bake-app/shared-types';

export interface IngredientFormData {
  name: string;
  unit: string;
  description?: string;
  calories?: number | null;
  category?: string;
  packages: { name: string; size: number; unit: string }[];
}

@Component({
  selector: 'bake-ingredient-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <form #ingredientForm="ngForm" (ngSubmit)="onSubmit()" class="ingredient-form">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Name</mat-label>
        <input
          matInput
          [(ngModel)]="formData.name"
          name="name"
          placeholder="e.g., Flour"
          required
        />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <input
          matInput
          [(ngModel)]="formData.description"
          name="description"
          placeholder="e.g., All-purpose wheat flour"
        />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Unit</mat-label>
        <mat-select [(ngModel)]="formData.unit" name="unit">
          <mat-option value="g">g</mat-option>
          <mat-option value="ml">ml</mat-option>
          <mat-option value="pcs">pcs</mat-option>
          <mat-option value="tbsp">tbsp</mat-option>
          <mat-option value="tsp">tsp</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Calories (per 100g)</mat-label>
        <input
          matInput
          type="number"
          [(ngModel)]="formData.calories"
          name="calories"
          placeholder="e.g., 364"
        />
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Category</mat-label>
        <mat-select [(ngModel)]="formData.category" name="category">
          <mat-option [value]="''">None</mat-option>
          <mat-option
            *ngFor="let cat of ingredientCategories"
            [value]="cat.name"
          >
            {{ cat.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <div class="packages-section" *ngIf="showPackages">
        <div class="section-label">Package Sizes</div>
        <div
          *ngFor="let pkg of formData.packages; let i = index"
          class="package-row"
        >
          <mat-form-field appearance="outline" class="pkg-name">
            <mat-label>Name</mat-label>
            <input
              matInput
              [(ngModel)]="pkg.name"
              [name]="'pkgName' + i"
              placeholder="e.g., 25lb bag"
            />
          </mat-form-field>
          <mat-form-field appearance="outline" class="pkg-size">
            <mat-label>Size</mat-label>
            <input
              matInput
              type="number"
              [(ngModel)]="pkg.size"
              [name]="'pkgSize' + i"
            />
          </mat-form-field>
          <mat-form-field appearance="outline" class="pkg-unit">
            <mat-label>Unit</mat-label>
            <input
              matInput
              [(ngModel)]="pkg.unit"
              [name]="'pkgUnit' + i"
              placeholder="lb"
            />
          </mat-form-field>
          <button
            mat-icon-button
            type="button"
            color="warn"
            (click)="removePackage(i)"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <button
          mat-button
          type="button"
          class="add-pkg-btn"
          (click)="addPackage()"
        >
          <mat-icon>add</mat-icon> Add Package
        </button>
      </div>

      <div class="form-actions">
        <button
          mat-button
          type="button"
          *ngIf="showCancel"
          (click)="cancel.emit()"
        >
          Cancel
        </button>
        <button mat-flat-button type="submit" class="save-btn">
          {{ submitLabel }}
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .ingredient-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .full-width {
        width: 100%;
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
      .save-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
      .packages-section {
        margin-bottom: 8px;
      }
      .section-label {
        font-size: 13px;
        font-weight: 500;
        color: #5d4037;
        margin-bottom: 8px;
      }
      .package-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pkg-name {
        flex: 2;
      }
      .pkg-size {
        flex: 1;
      }
      .pkg-unit {
        flex: 1;
      }
      .add-pkg-btn {
        color: #8b4513;
      }
    `,
  ],
})
export class IngredientFormComponent implements OnInit, OnChanges {
  @ViewChild('ingredientForm') ingredientForm!: NgForm;
  @Input() submitLabel = 'Add Ingredient';
  @Input() showCancel = false;
  @Input() showPackages = true;
  @Input() initialData: Partial<IngredientFormData> | null = null;
  @Output() save = new EventEmitter<IngredientFormData>();
  @Output() cancel = new EventEmitter<void>();

  formData: IngredientFormData = {
    name: '',
    unit: 'g',
    description: '',
    calories: null,
    category: '',
    packages: [],
  };

  ingredientCategories: Category[] = [];

  constructor(private apiClient: ApiClientService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.applyInitialData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && !changes['initialData'].firstChange) {
      this.applyInitialData();
    }
  }

  private applyInitialData(): void {
    if (this.initialData) {
      this.formData = {
        name: this.initialData.name || '',
        unit: this.initialData.unit || 'g',
        description: this.initialData.description || '',
        calories: this.initialData.calories ?? null,
        category: this.initialData.category || '',
        packages: this.initialData.packages || [],
      };
    }
  }

  private loadCategories(): void {
    this.apiClient.get<Category[]>('/v1/categories?type=ingredient').subscribe({
      next: (cats) => (this.ingredientCategories = cats),
      error: () => {},
    });
  }

  onSubmit(): void {
    if (!this.formData.name.trim()) return;
    this.save.emit({ ...this.formData });
  }

  resetForm(): void {
    this.formData = {
      name: '',
      unit: 'g',
      description: '',
      calories: null,
      category: '',
      packages: [],
    };
    this.ingredientForm?.resetForm({
      name: '',
      description: '',
      unit: 'g',
      calories: null,
      category: '',
    });
  }

  addPackage(): void {
    this.formData.packages = [
      ...this.formData.packages,
      { name: '', size: 0, unit: '' },
    ];
  }

  removePackage(index: number): void {
    this.formData.packages = this.formData.packages.filter(
      (_, i) => i !== index,
    );
  }
}
