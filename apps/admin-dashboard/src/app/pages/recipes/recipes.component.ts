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
import {
  Recipe,
  Menu,
  Product as SharedProduct,
  Category as SharedCategory,
  Ingredient as SharedIngredient,
} from '@bake-app/shared-types';
import { MenuDialogComponent, MenuDialogData } from '../menu/menu.component';
import { forkJoin } from 'rxjs';

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
  _rawName: string;
  _rawCostPerUnit: number;
  _rawInstructions: string;
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
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      width: '160px',
      actions: [
        { action: 'create_menu_item', icon: 'restaurant_menu', tooltip: 'Create Menu Item' },
        { action: 'edit', icon: 'edit', tooltip: 'Edit' },
        { action: 'delete', icon: 'delete', color: 'warn', tooltip: 'Delete' },
      ],
    },
  ];

  recipes: RecipeData[] = [];
  loading = false;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private confirmService: BakeConfirmationService,
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.loadRecipes();
  }

  private loadRecipes(): void {
    this.loading = true;
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
            _rawName: r.name,
            _rawCostPerUnit: Number(r.costPerUnit),
            _rawInstructions: r.instructions || '',
          }));
          this.loading = false;
        },
        error: () => {
          this.toastService.error('Failed to load recipes');
          this.loading = false;
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
    if (event.action === 'create_menu_item') {
      this.openCreateMenuItemDialog(event.row);
    } else if (event.action === 'edit') {
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

  private openCreateMenuItemDialog(recipe: RecipeData): void {
    forkJoin([
      this.apiClient.get<Menu[]>('/v1/menus'),
      this.apiClient.get<SharedCategory[]>('/v1/categories'),
      this.apiClient.get<PaginatedResponse<Recipe>>('/v1/recipes?limit=500'),
      this.apiClient.get<PaginatedResponse<SharedIngredient>>('/v1/ingredients?limit=500'),
    ]).subscribe({
      next: ([menus, cats, recipesRes, ingredientsRes]) => {
        const dialogRef = this.dialog.open(MenuDialogComponent, {
          width: '580px',
          data: {
            mode: 'create',
            categories: cats.map((c) => ({ id: c.id, name: c.name })),
            recipes: recipesRes.data.map((r) => ({
              id: r.id,
              name: r.name,
              costPerUnit: Number(r.costPerUnit),
            })),
            ingredients: ingredientsRes.data.map((i) => ({
              id: i.id,
              name: i.name,
              costPerUnit: Number(i.costPerUnit),
            })),
            menus: menus.map((m) => ({ id: m.id, name: m.name })),
            presetRecipeId: recipe.id,
            presetName: recipe._rawName,
            presetDescription: recipe._rawInstructions,
            presetCostPrice: recipe._rawCostPerUnit,
          } as MenuDialogData,
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            const menuId = result.menuId;
            delete result.menuId;
            this.apiClient
              .post<SharedProduct>('/v1/products', result)
              .subscribe({
                next: (created) => {
                  if (menuId) {
                    this.apiClient
                      .post(`/v1/menus/${menuId}/products`, {
                        productId: created.id,
                      })
                      .subscribe({
                        next: () => {
                          this.toastService.success(
                            'Menu item created and added to menu'
                          );
                        },
                        error: () => {
                          this.toastService.success(
                            'Menu item created but failed to add to menu'
                          );
                        },
                      });
                  } else {
                    this.toastService.success('Menu item created successfully');
                  }
                },
                error: () => {
                  this.toastService.error('Failed to create menu item');
                },
              });
          }
        });
      },
      error: () => {
        this.toastService.error('Failed to load data for menu item creation');
      },
    });
  }
}
