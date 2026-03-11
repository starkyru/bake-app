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
import { IngredientCategory } from '@bake-app/shared-types';

export interface IngredientFormData {
  name: string;
  unit: string;
  description?: string;
  calories?: number | null;
  category?: string;
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
          min="0"
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

      <div class="form-actions">
        <button
          mat-button
          type="button"
          *ngIf="showCancel"
          (click)="cancel.emit()"
        >
          Cancel
        </button>
        <button mat-flat-button type="submit" class="save-btn" [disabled]="saving">
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
    `,
  ],
})
export class IngredientFormComponent implements OnInit, OnChanges {
  @ViewChild('ingredientForm') ingredientForm!: NgForm;
  @Input() submitLabel = 'Add Ingredient';
  @Input() showCancel = false;
  @Input() initialData: Partial<IngredientFormData> | null = null;
  @Input() saving = false;
  @Output() save = new EventEmitter<IngredientFormData>();
  @Output() cancel = new EventEmitter<void>();

  formData: IngredientFormData = {
    name: '',
    unit: 'g',
    description: '',
    calories: null,
    category: '',
  };

  ingredientCategories: IngredientCategory[] = [];

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
      };
    }
  }

  private loadCategories(): void {
    this.apiClient.get<IngredientCategory[]>('/v1/ingredient-categories').subscribe({
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
    };
    this.ingredientForm?.resetForm({
      name: '',
      description: '',
      unit: 'g',
      calories: null,
      category: '',
    });
  }
}
