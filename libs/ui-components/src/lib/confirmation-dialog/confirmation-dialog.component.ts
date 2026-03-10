import { Component, Inject, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Observable, map } from 'rxjs';
import { ConfirmationDialogData } from '../models';

@Component({
  selector: 'bake-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">
        {{ data.cancelText || 'Cancel' }}
      </button>
      <button
        mat-flat-button
        [color]="data.confirmColor || 'primary'"
        [mat-dialog-close]="true"
      >
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      mat-dialog-content {
        padding: 0 24px;
      }

      mat-dialog-content p {
        font-size: 14px;
        color: #607d8b;
        margin: 0;
      }

      mat-dialog-actions {
        padding: 8px 24px;
      }
    `,
  ],
})
export class BakeConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BakeConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData,
  ) {}
}

@Injectable({ providedIn: 'root' })
export class BakeConfirmationService {
  constructor(private dialog: MatDialog) {}

  confirm(data: ConfirmationDialogData): Observable<boolean> {
    const dialogRef = this.dialog.open(BakeConfirmationDialogComponent, {
      width: '400px',
      data,
      autoFocus: false,
    });

    return dialogRef.afterClosed().pipe(map((result) => result === true));
  }
}
