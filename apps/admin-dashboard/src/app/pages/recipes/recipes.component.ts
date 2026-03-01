import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  BakeDataTableComponent,
  BakePageContainerComponent,
  BakeConfirmationService,
  BakeToastService,
  TableColumn,
} from '@bake-app/ui-components';

interface RecipeData {
  id: string;
  name: string;
  category: string;
  yield: string;
  costPerUnit: number;
  version: string;
  actions: string;
}

@Component({
  selector: 'bake-app-recipes',
  standalone: true,
  imports: [
    CommonModule,
    BakeDataTableComponent,
    BakePageContainerComponent,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <bake-page-container title="Recipes" subtitle="Manage bakery recipes and formulations">
      <div class="page-actions">
        <button mat-flat-button class="add-btn" (click)="onAddRecipe()">
          <mat-icon>add</mat-icon>
          Add Recipe
        </button>
      </div>

      <bake-data-table
        [columns]="columns"
        [data]="recipes"
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
        margin-bottom: 16px;
      }
      .add-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }
    `,
  ],
})
export class RecipesComponent {
  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category', type: 'badge', sortable: true },
    { key: 'yield', label: 'Yield', sortable: true },
    { key: 'costPerUnit', label: 'Cost/Unit', type: 'currency', sortable: true },
    { key: 'version', label: 'Version', sortable: true },
    { key: 'actions', label: 'Actions', type: 'actions', width: '120px' },
  ];

  recipes: RecipeData[] = [
    {
      id: '1',
      name: 'Classic Sourdough',
      category: 'Bread',
      yield: '10 loaves',
      costPerUnit: 320,
      version: 'v2.1',
      actions: '',
    },
    {
      id: '2',
      name: 'Butter Croissant',
      category: 'Pastry',
      yield: '24 pcs',
      costPerUnit: 210,
      version: 'v1.3',
      actions: '',
    },
    {
      id: '3',
      name: 'Napoleon Cake',
      category: 'Cake',
      yield: '1 cake',
      costPerUnit: 1100,
      version: 'v1.0',
      actions: '',
    },
    {
      id: '4',
      name: 'Chocolate Chip Cookie',
      category: 'Cookie',
      yield: '48 pcs',
      costPerUnit: 120,
      version: 'v2.0',
      actions: '',
    },
    {
      id: '5',
      name: 'French Baguette',
      category: 'Bread',
      yield: '12 baguettes',
      costPerUnit: 180,
      version: 'v1.5',
      actions: '',
    },
    {
      id: '6',
      name: 'Medovik (Honey Cake)',
      category: 'Cake',
      yield: '1 cake',
      costPerUnit: 950,
      version: 'v1.2',
      actions: '',
    },
    {
      id: '7',
      name: 'Chicken Puff',
      category: 'Savory',
      yield: '20 pcs',
      costPerUnit: 310,
      version: 'v1.1',
      actions: '',
    },
    {
      id: '8',
      name: 'Classic Eclair',
      category: 'Pastry',
      yield: '30 pcs',
      costPerUnit: 190,
      version: 'v1.4',
      actions: '',
    },
  ];

  constructor(
    private router: Router,
    private confirmService: BakeConfirmationService,
    private toastService: BakeToastService
  ) {}

  onAddRecipe(): void {
    this.router.navigate(['/recipes', 'new']);
  }

  onRowClick(row: RecipeData): void {
    this.router.navigate(['/recipes', row.id]);
  }

  onRowAction(event: { action: string; row: RecipeData }): void {
    if (event.action === 'edit') {
      this.router.navigate(['/recipes', event.row.id]);
    } else if (event.action === 'delete') {
      this.confirmService
        .confirm({
          title: 'Delete Recipe',
          message: `Are you sure you want to delete "${event.row.name}"? This action cannot be undone.`,
          confirmText: 'Delete',
          confirmColor: 'warn',
        })
        .subscribe((confirmed) => {
          if (confirmed) {
            this.recipes = this.recipes.filter((r) => r.id !== event.row.id);
            this.toastService.success('Recipe deleted successfully');
          }
        });
    }
  }
}
