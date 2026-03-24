import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import {
  BakeDataTableComponent,
  BakePageContainerComponent,
  BakeConfirmationService,
  BakeToastService,
  TableColumn,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { Menu } from '@bake-app/shared-types';
import { MenuFormDialogComponent, MenuFormDialogData } from './menu-form-dialog.component';

interface MenuData {
  id: string;
  name: string;
  description: string;
  productCount: number;
  actions: string;
}

@Component({
  selector: 'bake-app-menus',
  standalone: true,
  imports: [
    CommonModule,
    BakeDataTableComponent,
    BakePageContainerComponent,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <bake-page-container title="Menus" subtitle="Manage your bakery menus">
      <div class="page-actions">
        <button mat-stroked-button (click)="navigateToAllItems()">
          <mat-icon>list</mat-icon>
          All Menu Items
        </button>
        <button mat-flat-button class="add-btn" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add Menu
        </button>
      </div>

      <bake-data-table
        [columns]="columns"
        [data]="menus"
        [loading]="loading"
        (rowClick)="onRowClick($event)"
        (rowAction)="onRowAction($event)"
      ></bake-data-table>
    </bake-page-container>
  `,
  styles: [
    `
      .page-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-bottom: 16px;
      }
      .add-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
    `,
  ],
})
export class MenusComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'productCount', label: 'Items', type: 'number' },
    { key: 'actions', label: 'Actions', type: 'actions', width: '120px' },
  ];

  menus: MenuData[] = [];
  loading = false;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private confirmService: BakeConfirmationService,
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.loadMenus();
  }

  private loadMenus(): void {
    this.loading = true;
    this.apiClient.get<Menu[]>('/v1/menus').subscribe({
      next: (menus) => {
        this.menus = menus.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description || '',
          productCount: m.productCount || 0,
          actions: '',
        }));
        this.loading = false;
      },
      error: () => {
        this.toastService.error('Failed to load menus');
        this.loading = false;
      },
    });
  }

  navigateToAllItems(): void {
    this.router.navigate(['/menu/items']);
  }

  onRowClick(row: MenuData): void {
    this.router.navigate(['/menu', row.id]);
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(MenuFormDialogComponent, {
      width: '500px',
      data: { mode: 'create' } as MenuFormDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiClient.post<Menu>('/v1/menus', result).subscribe({
          next: (created) => {
            this.menus = [
              ...this.menus,
              {
                id: created.id,
                name: created.name,
                description: created.description || '',
                productCount: created.productCount || 0,
                actions: '',
              },
            ];
            this.toastService.success('Menu created successfully');
          },
          error: () => {
            this.toastService.error('Failed to create menu');
          },
        });
      }
    });
  }

  openEditDialog(menu: MenuData): void {
    const dialogRef = this.dialog.open(MenuFormDialogComponent, {
      width: '500px',
      data: {
        mode: 'edit',
        menu: { name: menu.name, description: menu.description },
      } as MenuFormDialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.apiClient.put<Menu>(`/v1/menus/${menu.id}`, result).subscribe({
          next: (updated) => {
            this.menus = this.menus.map((m) =>
              m.id === menu.id
                ? {
                    id: updated.id,
                    name: updated.name,
                    description: updated.description || '',
                    productCount: updated.productCount || m.productCount,
                    actions: '',
                  }
                : m,
            );
            this.toastService.success('Menu updated successfully');
          },
          error: () => {
            this.toastService.error('Failed to update menu');
          },
        });
      }
    });
  }

  onRowAction(event: { action: string; row: MenuData }): void {
    if (event.action === 'edit') {
      this.openEditDialog(event.row);
    } else if (event.action === 'delete') {
      this.confirmService
        .confirm({
          title: 'Delete Menu',
          message: `Are you sure you want to delete "${event.row.name}"? This action cannot be undone.`,
          confirmText: 'Delete',
          confirmColor: 'warn',
        })
        .subscribe((confirmed) => {
          if (confirmed) {
            this.apiClient.delete(`/v1/menus/${event.row.id}`).subscribe({
              next: () => {
                this.menus = this.menus.filter((m) => m.id !== event.row.id);
                this.toastService.success('Menu deleted successfully');
              },
              error: () => {
                this.toastService.error('Failed to delete menu');
              },
            });
          }
        });
    }
  }
}
