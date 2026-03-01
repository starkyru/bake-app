import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SelectOption } from '../models';

@Component({
  selector: 'bake-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BakeSelectComponent),
      multi: true,
    },
  ],
  template: `
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>{{ label }}</mat-label>
      <mat-select
        [placeholder]="placeholder"
        [required]="required"
        [multiple]="multiple"
        [disabled]="disabled"
        [value]="value"
        (selectionChange)="onSelectionChange($event.value)"
        (blur)="onTouched()"
      >
        <mat-option
          *ngFor="let option of options"
          [value]="option.value"
          [disabled]="option.disabled ?? false"
        >
          {{ option.label }}
        </mat-option>
      </mat-select>
    </mat-form-field>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class BakeSelectComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() options: SelectOption[] = [];
  @Input() placeholder = '';
  @Input() required = false;
  @Input() multiple = false;

  value: any = null;
  disabled = false;
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSelectionChange(value: any): void {
    this.value = value;
    this.onChange(this.value);
  }
}
