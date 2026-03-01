import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class BakeToastService {
  private readonly defaultDuration = 3000;
  private readonly errorDuration = 5000;

  constructor(private snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: this.defaultDuration,
      panelClass: ['bake-toast-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: this.errorDuration,
      panelClass: ['bake-toast-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  warning(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: this.defaultDuration,
      panelClass: ['bake-toast-warning'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  info(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: this.defaultDuration,
      panelClass: ['bake-toast-info'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
