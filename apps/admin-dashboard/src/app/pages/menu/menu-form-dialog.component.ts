import { Component, Inject } from '@angular/core';
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

export interface MenuFormDialogData {
  mode: 'create' | 'edit';
  menu?: { name: string; description?: string };
}

@Component({
  selector: 'bake-app-menu-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Create Menu' : 'Edit Menu' }}</h2>
    <mat-dialog-content class="dialog-content">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Menu Name</mat-label>
        <input matInput [(ngModel)]="name" placeholder="e.g. Breakfast Menu" required />
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Description</mat-label>
        <textarea
          matInput
          [(ngModel)]="description"
          rows="3"
          placeholder="Optional description"
        ></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Cancel</button>
      <button
        mat-flat-button
        class="save-btn"
        [disabled]="!name.trim()"
        (click)="onSave()"
      >
        {{ data.mode === 'create' ? 'Create' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 400px;
        padding-top: 8px;
      }
      .full-width {
        width: 100%;
      }
      .save-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
    `,
  ],
})
export class MenuFormDialogComponent {
  name = '';
  description = '';

  constructor(
    public dialogRef: MatDialogRef<MenuFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MenuFormDialogData,
  ) {
    if (data.menu) {
      this.name = data.menu.name;
      this.description = data.menu.description || '';
    }
  }

  onSave(): void {
    this.dialogRef.close({ name: this.name.trim(), description: this.description.trim() });
  }
}
