import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import {
  BakeDataTableComponent,
  BakePageContainerComponent,
  BakeStatsCardComponent,
  TableColumn,
} from '@bake-app/ui-components';

interface ProductionItem {
  time: string;
  recipe: string;
  category: string;
  planned: number;
  completed: number;
  status: string;
  assigned: string;
}

interface IngredientRequirement {
  ingredient: string;
  required: number;
  available: number;
  unit: string;
  status: string;
}

@Component({
  selector: 'bake-app-production',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    BakeDataTableComponent,
    BakePageContainerComponent,
    BakeStatsCardComponent,
  ],
  template: `
    <bake-page-container title="Production" subtitle="Daily production plan and ingredient requirements">
      <!-- Production KPIs -->
      <div class="kpi-grid">
        <bake-stats-card
          title="Planned Items"
          value="480"
          icon="assignment"
          color="primary"
        ></bake-stats-card>

        <bake-stats-card
          title="Completed"
          value="312"
          icon="check_circle"
          [trend]="65"
          trendLabel="% done"
          color="accent"
        ></bake-stats-card>

        <bake-stats-card
          title="In Progress"
          value="98"
          icon="pending"
          color="primary"
        ></bake-stats-card>

        <bake-stats-card
          title="Behind Schedule"
          value="3"
          icon="warning"
          color="warn"
        ></bake-stats-card>
      </div>

      <!-- Production Plan Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title class="section-title">
            <mat-icon class="section-icon">schedule</mat-icon>
            Daily Production Plan
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <bake-data-table
            [columns]="productionColumns"
            [data]="productionData"
            [searchable]="true"
          ></bake-data-table>
        </mat-card-content>
      </mat-card>

      <!-- Ingredient Requirements Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title class="section-title">
            <mat-icon class="section-icon">kitchen</mat-icon>
            Ingredient Requirements
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <bake-data-table
            [columns]="ingredientColumns"
            [data]="ingredientData"
            [searchable]="false"
          ></bake-data-table>
        </mat-card-content>
      </mat-card>
    </bake-page-container>
  `,
  styles: [
    `
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 24px;
      }

      .table-card {
        border-radius: 12px;
        margin-bottom: 24px;
      }

      .table-card:last-child {
        margin-bottom: 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #3e2723;
      }

      .section-icon {
        color: #8b4513;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      @media (max-width: 1200px) {
        .kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 768px) {
        .kpi-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ProductionComponent {
  productionColumns: TableColumn[] = [
    { key: 'time', label: 'Time', type: 'text', width: '90px' },
    { key: 'recipe', label: 'Recipe', type: 'text' },
    { key: 'category', label: 'Category', type: 'text', width: '110px' },
    { key: 'planned', label: 'Planned Qty', type: 'number', width: '110px' },
    { key: 'completed', label: 'Completed', type: 'number', width: '100px' },
    { key: 'status', label: 'Status', type: 'badge', width: '130px' },
    { key: 'assigned', label: 'Assigned', type: 'text', width: '120px' },
  ];

  productionData: ProductionItem[] = [
    { time: '05:00', recipe: 'Sourdough Bread', category: 'Bread', planned: 50, completed: 50, status: 'Completed', assigned: 'Baker A' },
    { time: '05:30', recipe: 'Baguette', category: 'Bread', planned: 40, completed: 40, status: 'Completed', assigned: 'Baker A' },
    { time: '06:00', recipe: 'Rye Bread', category: 'Bread', planned: 20, completed: 20, status: 'Completed', assigned: 'Baker B' },
    { time: '06:00', recipe: 'Croissant', category: 'Pastries', planned: 60, completed: 45, status: 'In Progress', assigned: 'Baker C' },
    { time: '06:30', recipe: 'Cinnamon Roll', category: 'Pastries', planned: 30, completed: 30, status: 'Completed', assigned: 'Baker C' },
    { time: '07:00', recipe: 'Napoleon Cake', category: 'Cakes', planned: 8, completed: 5, status: 'In Progress', assigned: 'Baker D' },
    { time: '07:00', recipe: 'Eclair', category: 'Pastries', planned: 40, completed: 28, status: 'In Progress', assigned: 'Baker B' },
    { time: '07:30', recipe: 'Cheesecake', category: 'Cakes', planned: 6, completed: 0, status: 'Pending', assigned: 'Baker D' },
    { time: '08:00', recipe: 'Fruit Tart', category: 'Pastries', planned: 15, completed: 0, status: 'Pending', assigned: 'Baker C' },
    { time: '08:00', recipe: 'Macaron Set', category: 'Pastries', planned: 20, completed: 0, status: 'Pending', assigned: 'Baker B' },
    { time: '09:00', recipe: 'Sandwich Bread', category: 'Bread', planned: 30, completed: 30, status: 'Completed', assigned: 'Baker A' },
    { time: '10:00', recipe: 'Chocolate Cake', category: 'Cakes', planned: 4, completed: 0, status: 'Pending', assigned: 'Baker D' },
  ];

  ingredientColumns: TableColumn[] = [
    { key: 'ingredient', label: 'Ingredient', type: 'text' },
    { key: 'required', label: 'Required', type: 'number', width: '100px' },
    { key: 'available', label: 'Available', type: 'number', width: '100px' },
    { key: 'unit', label: 'Unit', type: 'text', width: '80px' },
    { key: 'status', label: 'Status', type: 'badge', width: '130px' },
  ];

  ingredientData: IngredientRequirement[] = [
    { ingredient: 'Wheat Flour', required: 45, available: 5, unit: 'kg', status: 'Low Stock' },
    { ingredient: 'Butter', required: 12, available: 8, unit: 'kg', status: 'Low Stock' },
    { ingredient: 'Sugar', required: 15, available: 25, unit: 'kg', status: 'In Stock' },
    { ingredient: 'Eggs', required: 80, available: 60, unit: 'pcs', status: 'Low Stock' },
    { ingredient: 'Heavy Cream', required: 8, available: 4, unit: 'L', status: 'Low Stock' },
    { ingredient: 'Whole Milk', required: 10, available: 12, unit: 'L', status: 'In Stock' },
    { ingredient: 'Dark Chocolate', required: 5, available: 0, unit: 'kg', status: 'Out of Stock' },
    { ingredient: 'Dry Yeast', required: 1.5, available: 2, unit: 'kg', status: 'In Stock' },
    { ingredient: 'Vanilla Extract', required: 0.2, available: 0.5, unit: 'L', status: 'In Stock' },
    { ingredient: 'Almonds', required: 3, available: 6, unit: 'kg', status: 'In Stock' },
    { ingredient: 'Fresh Berries', required: 4, available: 0, unit: 'kg', status: 'Out of Stock' },
  ];
}
