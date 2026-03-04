import { Component, OnInit } from '@angular/core';
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
import { ApiClientService } from '@bake-app/api-client';
import { Recipe } from '@bake-app/shared-types';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
export class RecipesComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category', type: 'badge', sortable: true },
    { key: 'yield', label: 'Yield', sortable: true },
    { key: 'costPerUnit', label: 'Cost/Unit', type: 'currency', sortable: true },
    { key: 'version', label: 'Version', sortable: true },
    { key: 'actions', label: 'Actions', type: 'actions', width: '120px' },
  ];

  recipes: RecipeData[] = [];

  constructor(
    private router: Router,
    private confirmService: BakeConfirmationService,
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.loadRecipes();
  }

  private loadRecipes(): void {
    this.apiClient
      .get<PaginatedResponse<Recipe>>('/v1/recipes?limit=100')
      .subscribe({
        next: (response) => {
          this.recipes = response.data.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category || '',
            yield: `${r.yieldQuantity} ${r.yieldUnit}`,
            costPerUnit: Number(r.costPerUnit),
            version: `v${r.currentVersion}.0`,
            actions: '',
          }));
        },
        error: () => {
          this.toastService.error('Failed to load recipes');
        },
      });
  }

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
            this.apiClient.delete(`/v1/recipes/${event.row.id}`).subscribe({
              next: () => {
                this.recipes = this.recipes.filter((r) => r.id !== event.row.id);
                this.toastService.success('Recipe deleted successfully');
              },
              error: () => {
                this.toastService.error('Failed to delete recipe');
              },
            });
          }
        });
    }
  }
}
