import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  BakePageContainerComponent,
  BakeDataTableComponent,
  BakeToastService,
  TableColumn,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import {
  AddShipmentDialogComponent,
  AddShipmentDialogData,
  AddShipmentDialogResult,
} from './add-shipment-dialog.component';

interface PackageStock {
  id: string;
  size: number;
  unit: string;
  remaining: number;
}

interface ShipmentRow {
  id: string;
  date: string;
  packageType: string;
  count: number;
  unitCost: string;
  location: string;
  batchNumber: string;
  notes: string;
}

@Component({
  selector: 'bake-app-inventory-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressBarModule,
    BakePageContainerComponent,
    BakeDataTableComponent,
  ],
  template: `
    <bake-page-container
      [title]="item?.title || 'Loading...'"
      [subtitle]="item?.ingredient?.name || ''"
    >
      <div class="page-actions">
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Back to Inventory
        </button>
        <button mat-flat-button class="add-btn" (click)="openAddShipment()" [disabled]="saving">
          <mat-icon>add</mat-icon>
          Add Shipment
        </button>
      </div>

      <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>

      <!-- Package Stock Cards -->
      <div class="stock-grid" *ngIf="packageStock.length > 0">
        <mat-card class="stock-card" *ngFor="let pkg of packageStock">
          <mat-card-content>
            <div class="stock-item">
              <mat-icon class="stock-icon" [class.stock-empty]="pkg.remaining <= 0">
                {{ pkg.remaining > 0 ? 'inventory_2' : 'remove_shopping_cart' }}
              </mat-icon>
              <div class="stock-details">
                <span class="stock-value">{{ pkg.remaining }}</span>
                <span class="stock-label">{{ pkg.size }} {{ pkg.unit }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Shipments Table -->
      <mat-card class="table-card">
        <mat-card-content>
          <div class="table-header">
            <h3 class="table-title">
              {{ showArchive ? 'All Shipments' : 'Active Shipments' }}
            </h3>
            <button mat-button (click)="toggleArchive()">
              <mat-icon>{{ showArchive ? 'visibility_off' : 'visibility' }}</mat-icon>
              {{ showArchive ? 'Hide Archive' : 'Show Archive' }}
            </button>
          </div>
          <bake-data-table
            [columns]="shipmentColumns"
            [data]="filteredShipments"
            [loading]="loading"
          ></bake-data-table>
        </mat-card-content>
      </mat-card>
    </bake-page-container>
  `,
  styles: [
    `
      .page-actions {
        display: flex;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .add-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
        border-radius: 8px;
      }

      .stock-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }

      .stock-card {
        border-radius: 12px;
      }

      .stock-item {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .stock-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #8b4513;
      }

      .stock-icon.stock-empty {
        color: #c62828;
      }

      .stock-details {
        display: flex;
        flex-direction: column;
      }

      .stock-value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 24px;
        font-weight: 700;
        color: #263238;
      }

      .stock-label {
        font-size: 12px;
        color: #78909c;
        font-weight: 500;
      }

      .table-card {
        border-radius: 12px;
      }

      .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .table-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #263238;
      }
    `,
  ],
})
export class InventoryDetailComponent implements OnInit {
  item: any = null;
  packageStock: PackageStock[] = [];
  allShipments: ShipmentRow[] = [];
  showArchive = false;
  loading = false;
  saving = false;
  private locations: { id: string; name: string }[] = [];

  shipmentColumns: TableColumn[] = [
    { key: 'date', label: 'Date', type: 'text', width: '160px' },
    { key: 'packageType', label: 'Package', type: 'text' },
    { key: 'count', label: 'Count', type: 'number', width: '100px' },
    { key: 'unitCost', label: 'Unit Cost', type: 'text', width: '100px' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'batchNumber', label: 'Batch #', type: 'text', width: '120px' },
    { key: 'notes', label: 'Notes', type: 'text' },
  ];

  get filteredShipments(): ShipmentRow[] {
    if (this.showArchive) return this.allShipments;
    return this.allShipments.filter((s) => s.count > 0);
  }

  private itemId = '';
  private datePipe = new DatePipe('en-US');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiClient: ApiClientService,
    private dialog: MatDialog,
    private toastService: BakeToastService,
  ) {}

  ngOnInit(): void {
    this.itemId = this.route.snapshot.paramMap.get('id') || '';
    this.loadItem();
    this.loadLocations();
  }

  goBack(): void {
    this.router.navigate(['/inventory']);
  }

  toggleArchive(): void {
    this.showArchive = !this.showArchive;
  }

  openAddShipment(): void {
    const dialogData: AddShipmentDialogData = {
      packages: (this.item?.packages || []).map((p: any) => ({
        id: p.id,
        size: p.size,
        unit: p.unit,
      })),
      locations: this.locations,
    };

    const ref = this.dialog.open(AddShipmentDialogComponent, {
      data: dialogData,
      width: '500px',
    });

    ref.afterClosed().subscribe((result: AddShipmentDialogResult | undefined) => {
      if (result) {
        this.saving = true;
        this.apiClient
          .post(`/v1/inventory/${this.itemId}/shipments`, result)
          .subscribe({
            next: () => {
              this.toastService.success('Shipment added');
              this.saving = false;
              this.loadItem();
            },
            error: () => {
              this.toastService.error('Failed to add shipment');
              this.saving = false;
            },
          });
      }
    });
  }

  private loadItem(): void {
    this.loading = true;
    this.apiClient.get<any>(`/v1/inventory/${this.itemId}`).subscribe({
      next: (data) => {
        this.item = data;
        this.packageStock = data.packageStock || [];
        this.allShipments = (data.shipments || []).map((s: any) => ({
          id: s.id,
          date: this.datePipe.transform(s.createdAt, 'MMM d, y HH:mm') || '',
          packageType: s.package ? `${s.package.size} ${s.package.unit}` : '',
          count: Number(s.packageCount),
          unitCost: s.unitCost ? `$${Number(s.unitCost).toFixed(2)}` : '',
          location: s.location?.name || '',
          batchNumber: s.batchNumber || '',
          notes: s.notes || '',
        }));
        this.loading = false;
      },
      error: () => {
        this.toastService.error('Failed to load inventory item');
        this.loading = false;
      },
    });
  }

  private loadLocations(): void {
    this.apiClient.get<any[]>('/v1/locations').subscribe({
      next: (locs) => (this.locations = locs),
      error: () => {},
    });
  }
}
