import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiClientService } from '@bake-app/api-client';
import { Order, Recipe } from '@bake-app/shared-types';

interface RecipeStep {
  step: number;
  instruction: string;
  duration: string;
}

interface Ingredient {
  name: string;
  amount: string;
  inStock: boolean;
}

interface OrderDetailData {
  id: string;
  orderNumber: string;
  customerName: string;
  recipeName: string;
  status: string;
  notes: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
}

@Component({
  selector: 'bake-app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    <div class="detail-overlay" (click)="goBack()">
      <div class="detail-panel" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="detail-header">
          <div class="header-info">
            <span class="order-number">#{{ orderDetail.orderNumber }}</span>
            <span class="recipe-name">{{ orderDetail.recipeName }}</span>
          </div>
          <button class="close-btn" (click)="goBack()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Customer & Status -->
        <div class="detail-meta">
          <div class="meta-item">
            <mat-icon>person</mat-icon>
            <span>{{ orderDetail.customerName }}</span>
          </div>
          <div class="meta-item">
            <span class="status-badge" [ngClass]="'status--' + orderDetail.status.toLowerCase()">
              {{ orderDetail.status }}
            </span>
          </div>
        </div>

        <!-- Notes -->
        <div class="detail-notes" *ngIf="orderDetail.notes">
          <mat-icon>sticky_note_2</mat-icon>
          <span>{{ orderDetail.notes }}</span>
        </div>

        <div class="detail-body">
          <!-- Ingredients -->
          <div class="detail-section">
            <h2 class="section-title">
              <mat-icon>inventory_2</mat-icon>
              Ingredients
            </h2>
            <div class="ingredients-grid">
              <div
                *ngFor="let ingredient of orderDetail.ingredients"
                class="ingredient-card"
                [class.ingredient-card--out]="!ingredient.inStock"
              >
                <div class="ingredient-info">
                  <span class="ingredient-name">{{ ingredient.name }}</span>
                  <span class="ingredient-amount">{{ ingredient.amount }}</span>
                </div>
                <mat-icon
                  class="ingredient-status"
                  [class.status-ok]="ingredient.inStock"
                  [class.status-warn]="!ingredient.inStock"
                >
                  {{ ingredient.inStock ? 'check_circle' : 'warning' }}
                </mat-icon>
              </div>
            </div>
          </div>

          <!-- Steps -->
          <div class="detail-section">
            <h2 class="section-title">
              <mat-icon>format_list_numbered</mat-icon>
              Preparation Steps
            </h2>
            <div class="steps-list">
              <div
                *ngFor="let step of orderDetail.steps"
                class="step-card"
              >
                <div class="step-number">{{ step.step }}</div>
                <div class="step-content">
                  <p class="step-instruction">{{ step.instruction }}</p>
                  <span class="step-duration">
                    <mat-icon>timer</mat-icon>
                    {{ step.duration }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="detail-footer">
          <button class="footer-btn footer-btn--back" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            BACK TO QUEUE
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 1000;
    }

    .detail-overlay {
      width: 100%;
      height: 100%;
      background-color: rgba(10, 10, 20, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .detail-panel {
      width: 100%;
      max-width: 900px;
      max-height: 90vh;
      background-color: #16213E;
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
    }

    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 28px;
      background-color: #0F0F23;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .order-number {
      font-family: 'JetBrains Mono', monospace;
      font-size: 28px;
      font-weight: 700;
      color: #FFB74D;
    }

    .recipe-name {
      font-size: 22px;
      font-weight: 600;
      color: #FFFFFF;
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      min-height: 56px;
      border: none;
      border-radius: 12px;
      background-color: rgba(255, 255, 255, 0.08);
      color: #FFFFFF;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .close-btn:hover {
      background-color: rgba(255, 255, 255, 0.15);
    }

    .close-btn mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .detail-meta {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 16px 28px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      color: rgba(255, 255, 255, 0.7);
    }

    .meta-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: rgba(255, 255, 255, 0.4);
    }

    .status-badge {
      padding: 6px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .status--new {
      background-color: rgba(79, 195, 247, 0.2);
      color: #4FC3F7;
    }

    .status--in_progress {
      background-color: rgba(255, 183, 77, 0.2);
      color: #FFB74D;
    }

    .status--ready {
      background-color: rgba(129, 199, 132, 0.2);
      color: #81C784;
    }

    .detail-notes {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 14px 28px;
      background-color: rgba(255, 183, 77, 0.08);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 15px;
      color: #FFB74D;
    }

    .detail-notes mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-top: 2px;
    }

    .detail-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px 28px;
    }

    .detail-section {
      margin-bottom: 32px;
    }

    .detail-section:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 700;
      color: #FFFFFF;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }

    .section-title mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #4FC3F7;
    }

    /* Ingredients Grid */
    .ingredients-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 10px;
    }

    .ingredient-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      background-color: rgba(255, 255, 255, 0.04);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .ingredient-card--out {
      border-color: rgba(239, 83, 80, 0.3);
      background-color: rgba(239, 83, 80, 0.06);
    }

    .ingredient-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .ingredient-name {
      font-size: 16px;
      font-weight: 600;
      color: #FFFFFF;
    }

    .ingredient-amount {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.5);
      font-family: 'JetBrains Mono', monospace;
    }

    .ingredient-status {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .status-ok {
      color: #81C784;
    }

    .status-warn {
      color: #EF5350;
    }

    /* Steps */
    .steps-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .step-card {
      display: flex;
      gap: 16px;
      padding: 16px;
      background-color: rgba(255, 255, 255, 0.04);
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .step-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      min-width: 40px;
      background-color: rgba(79, 195, 247, 0.15);
      color: #4FC3F7;
      border-radius: 50%;
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      font-weight: 700;
    }

    .step-content {
      flex: 1;
    }

    .step-instruction {
      font-size: 16px;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.85);
      margin: 0 0 8px 0;
    }

    .step-duration {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-family: 'JetBrains Mono', monospace;
      color: rgba(255, 255, 255, 0.4);
    }

    .step-duration mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    /* Footer */
    .detail-footer {
      padding: 20px 28px;
      background-color: #0F0F23;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .footer-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      min-height: 64px;
      border: none;
      border-radius: 10px;
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 1px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-transform: uppercase;
    }

    .footer-btn mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .footer-btn--back {
      background-color: rgba(255, 255, 255, 0.08);
      color: #FFFFFF;
    }

    .footer-btn--back:hover {
      background-color: rgba(255, 255, 255, 0.14);
    }
  `],
})
export class OrderDetailComponent implements OnInit {
  orderId = '';
  orderDetail: OrderDetailData = {
    id: '',
    orderNumber: '',
    customerName: '',
    recipeName: '',
    status: '',
    notes: '',
    ingredients: [],
    steps: [],
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    this.loadOrderDetail();
  }

  goBack(): void {
    this.router.navigate(['/queue']);
  }

  private loadOrderDetail(): void {
    this.apiClient.get<Order>(`/v1/orders/${this.orderId}`).subscribe({
      next: (order) => {
        const statusMap: Record<string, string> = {
          pending: 'NEW',
          confirmed: 'NEW',
          in_progress: 'IN_PROGRESS',
          completed: 'READY',
        };
        this.orderDetail = {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.notes || `Order ${order.orderNumber}`,
          recipeName: order.items.map((i) => i.product?.name || 'Item').join(', '),
          status: statusMap[order.status] || order.status,
          notes: order.notes || '',
          ingredients: [],
          steps: [],
        };

        const itemWithRecipe = order.items.find(i => i.product?.recipeId);
        if (itemWithRecipe?.product?.recipeId) {
          this.loadRecipe(itemWithRecipe.product.recipeId);
        }
      },
      error: () => {
        this.orderDetail = {
          id: this.orderId,
          orderNumber: '',
          customerName: 'Unknown',
          recipeName: 'Unknown Order',
          status: 'NEW',
          notes: '',
          ingredients: [],
          steps: [],
        };
      },
    });
  }

  private loadRecipe(recipeId: string): void {
    this.apiClient.get<Recipe>(`/v1/recipes/${recipeId}`).subscribe({
      next: (recipe) => {
        this.orderDetail.ingredients = recipe.ingredients.map(ing => ({
          name: ing.ingredientName || 'Ingredient',
          amount: `${ing.quantity} ${ing.unit}`,
          inStock: true,
        }));

        if (recipe.instructions) {
          this.orderDetail.steps = recipe.instructions
            .split('\n')
            .filter(line => line.trim())
            .map((line, index) => ({
              step: index + 1,
              instruction: line.trim(),
              duration: '',
            }));
        }
      },
    });
  }
}
