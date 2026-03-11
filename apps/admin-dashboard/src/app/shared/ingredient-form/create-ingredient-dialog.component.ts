import { Component, ViewChild } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { BakeToastService } from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { Ingredient } from '@bake-app/shared-types';
import {
  IngredientFormComponent,
  IngredientFormData,
} from './ingredient-form.component';

@Component({
  selector: 'bake-create-ingredient-dialog',
  standalone: true,
  imports: [MatDialogModule, MatIconModule, IngredientFormComponent],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">add_circle</mat-icon>
      New Ingredient
    </h2>
    <mat-dialog-content>
      <bake-ingredient-form
        submitLabel="Create Ingredient"
        [showCancel]="true"
          [saving]="saving"
        (save)="onCreate($event)"
        (cancel)="dialogRef.close(null)"
      ></bake-ingredient-form>
    </mat-dialog-content>
  `,
  styles: [
    `
      .title-icon {
        vertical-align: middle;
        margin-right: 8px;
        color: #8b4513;
      }
      mat-dialog-content {
        min-width: 400px;
      }
    `,
  ],
})
export class CreateIngredientDialogComponent {
  @ViewChild(IngredientFormComponent) form!: IngredientFormComponent;
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<CreateIngredientDialogComponent>,
    private apiClient: ApiClientService,
    private toastService: BakeToastService,
  ) {}

  onCreate(data: IngredientFormData): void {
    const dto = {
      name: data.name,
      unit: data.unit,
      description: data.description || undefined,
      calories: data.calories ?? undefined,
      category: data.category || undefined,
    };

    this.saving = true;
    this.apiClient.post<Ingredient>('/v1/ingredients', dto).subscribe({
      next: (created) => {
        this.saving = false;
        this.toastService.success(`Ingredient "${created.name}" created`);
        this.dialogRef.close(created);
      },
      error: () => {
        this.saving = false;
        this.toastService.error('Failed to create ingredient');
      },
    });
  }
}
