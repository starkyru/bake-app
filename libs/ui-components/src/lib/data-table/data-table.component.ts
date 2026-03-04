import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnInit,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { TableColumn } from '../models';

@Component({
  selector: 'bake-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
  ],
  template: `
    <div class="table-container">
      <div class="table-header" *ngIf="searchable">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search</mat-label>
          <input
            matInput
            (keyup)="applyFilter($event)"
            placeholder="Search..."
            #input
          />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <div class="table-actions">
          <ng-content select="[tableActions]"></ng-content>
        </div>
      </div>
      <div class="mat-elevation-z2 table-wrapper">
        <table mat-table [dataSource]="dataSource" matSort>
          <ng-container *ngFor="let col of columns" [matColumnDef]="col.key">
            <th
              mat-header-cell
              *matHeaderCellDef
              [mat-sort-header]="col.sortable !== false ? col.key : ''"
              [style.width]="col.width"
            >
              {{ col.label }}
            </th>
            <td mat-cell *matCellDef="let row">
              <ng-container [ngSwitch]="col.type">
                <span *ngSwitchCase="'currency'" class="currency">
                  {{ row[col.key] | currency : 'USD' : 'symbol' : '1.0-0' }}
                </span>
                <span *ngSwitchCase="'date'">
                  {{ row[col.key] | date : 'short' }}
                </span>
                <mat-chip
                  *ngSwitchCase="'badge'"
                  [class]="
                    'badge-' +
                    (row[col.key] || '')
                      .toString()
                      .toLowerCase()
                      .replace(' ', '-')
                  "
                >
                  {{ row[col.key] }}
                </mat-chip>
                <span *ngSwitchCase="'actions'" class="actions">
                  <ng-container *ngIf="col.actions; else defaultActions">
                    <button
                      *ngFor="let act of col.actions"
                      mat-icon-button
                      [color]="act.color || ''"
                      [title]="act.tooltip || act.action"
                      (click)="
                        rowAction.emit({ action: act.action, row: row });
                        $event.stopPropagation()
                      "
                    >
                      <mat-icon>{{ act.icon }}</mat-icon>
                    </button>
                  </ng-container>
                  <ng-template #defaultActions>
                    <button
                      mat-icon-button
                      (click)="
                        rowAction.emit({ action: 'edit', row: row });
                        $event.stopPropagation()
                      "
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      color="warn"
                      (click)="
                        rowAction.emit({ action: 'delete', row: row });
                        $event.stopPropagation()
                      "
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </ng-template>
                </span>
                <span *ngSwitchDefault>{{ row[col.key] }}</span>
              </ng-container>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: displayedColumns"
            (click)="rowClick.emit(row)"
          ></tr>
        </table>
        <mat-paginator
          [pageSizeOptions]="[10, 25, 50]"
          showFirstLastButtons
        ></mat-paginator>
      </div>
    </div>
  `,
  styles: [
    `
      .table-container {
        width: 100%;
      }
      .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .search-field {
        width: 300px;
      }
      .table-wrapper {
        overflow: auto;
        border-radius: 8px;
      }
      table {
        width: 100%;
      }
      .currency {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 500;
      }
      .actions {
        display: flex;
        gap: 4px;
      }
      .badge-active,
      .badge-completed,
      .badge-in-stock {
        background-color: #e8f5e9 !important;
        color: #2e7d32 !important;
      }
      .badge-pending,
      .badge-low-stock,
      .badge-in-progress {
        background-color: #fff8e1 !important;
        color: #f57f17 !important;
      }
      .badge-inactive,
      .badge-cancelled,
      .badge-out-of-stock {
        background-color: #ffebee !important;
        color: #c62828 !important;
      }
      tr.mat-mdc-row:hover {
        background-color: #faf3e8;
        cursor: pointer;
      }
    `,
  ],
})
export class BakeDataTableComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() searchable = true;
  @Output() rowClick = new EventEmitter<any>();
  @Output() rowAction = new EventEmitter<{ action: string; row: any }>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<any>();
  displayedColumns: string[] = [];

  ngOnInit() {
    this.displayedColumns = this.columns.map((c) => c.key);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.dataSource.data = this.data;
    }
    if (changes['columns']) {
      this.displayedColumns = this.columns.map((c) => c.key);
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
