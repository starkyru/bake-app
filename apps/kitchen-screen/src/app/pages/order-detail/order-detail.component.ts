import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

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
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    this.loadSampleDetail();
  }

  goBack(): void {
    this.router.navigate(['/queue']);
  }

  private loadSampleDetail(): void {
    const details: Record<string, OrderDetailData> = {
      '1': {
        id: '1',
        orderNumber: '0147',
        customerName: 'Sarah M.',
        recipeName: 'Croissant Batch',
        status: 'NEW',
        notes: 'Customer prefers extra flaky. No nuts due to allergy.',
        ingredients: [
          { name: 'Bread Flour', amount: '500g', inStock: true },
          { name: 'Unsalted Butter', amount: '280g', inStock: true },
          { name: 'Whole Milk', amount: '150ml', inStock: true },
          { name: 'Sugar', amount: '50g', inStock: true },
          { name: 'Salt', amount: '10g', inStock: true },
          { name: 'Active Dry Yeast', amount: '7g', inStock: true },
          { name: 'Egg (for wash)', amount: '1 pc', inStock: true },
        ],
        steps: [
          { step: 1, instruction: 'Mix flour, sugar, salt, and yeast in a large bowl. Add milk and combine until a rough dough forms.', duration: '5 min' },
          { step: 2, instruction: 'Knead dough on a floured surface until smooth and elastic. Wrap in plastic and refrigerate for 1 hour.', duration: '1 hr 10 min' },
          { step: 3, instruction: 'Roll butter block into a flat rectangle between parchment paper. Keep cold.', duration: '5 min' },
          { step: 4, instruction: 'Roll out chilled dough, place butter in center, and perform 3 letter folds with 30-minute rests between each.', duration: '2 hr' },
          { step: 5, instruction: 'Roll final dough to 5mm thickness, cut triangles, and roll into croissant shapes.', duration: '15 min' },
          { step: 6, instruction: 'Proof at room temperature until doubled in size (about 1.5-2 hours). Brush with egg wash.', duration: '2 hr' },
          { step: 7, instruction: 'Bake at 200C (400F) until golden brown and flaky.', duration: '15 min' },
        ],
      },
      '4': {
        id: '4',
        orderNumber: '0144',
        customerName: 'Michael T.',
        recipeName: 'Fruit Tart',
        status: 'IN_PROGRESS',
        notes: 'Use seasonal berries. Extra glaze on top.',
        ingredients: [
          { name: 'All-Purpose Flour', amount: '250g', inStock: true },
          { name: 'Unsalted Butter', amount: '125g', inStock: true },
          { name: 'Powdered Sugar', amount: '75g', inStock: true },
          { name: 'Egg Yolks', amount: '2 pcs', inStock: true },
          { name: 'Pastry Cream', amount: '400ml', inStock: true },
          { name: 'Mixed Berries', amount: '300g', inStock: false },
          { name: 'Apricot Jam', amount: '100g', inStock: true },
        ],
        steps: [
          { step: 1, instruction: 'Prepare the sweet tart dough (pate sucree). Combine flour, butter, and sugar. Add egg yolks.', duration: '10 min' },
          { step: 2, instruction: 'Press dough into tart ring, prick bottom with fork. Blind bake at 180C with weights.', duration: '20 min' },
          { step: 3, instruction: 'Remove weights, bake until golden. Allow to cool completely.', duration: '25 min' },
          { step: 4, instruction: 'Fill cooled shell with pastry cream, spreading evenly to edges.', duration: '5 min' },
          { step: 5, instruction: 'Arrange fresh berries decoratively over pastry cream in concentric circles.', duration: '10 min' },
          { step: 6, instruction: 'Heat apricot jam and brush over berries for shine. Refrigerate until service.', duration: '5 min' },
        ],
      },
    };

    this.orderDetail = details[this.orderId] || {
      id: this.orderId,
      orderNumber: this.orderId.padStart(4, '0'),
      customerName: 'Guest Customer',
      recipeName: 'Standard Order',
      status: 'NEW',
      notes: '',
      ingredients: [
        { name: 'Bread Flour', amount: '500g', inStock: true },
        { name: 'Butter', amount: '200g', inStock: true },
        { name: 'Sugar', amount: '100g', inStock: true },
        { name: 'Eggs', amount: '4 pcs', inStock: true },
        { name: 'Milk', amount: '250ml', inStock: true },
        { name: 'Vanilla Extract', amount: '5ml', inStock: true },
      ],
      steps: [
        { step: 1, instruction: 'Preheat oven to 180C (350F). Prepare baking trays with parchment paper.', duration: '5 min' },
        { step: 2, instruction: 'Combine dry ingredients in a large mixing bowl. Whisk together.', duration: '3 min' },
        { step: 3, instruction: 'In a separate bowl, cream butter and sugar until light and fluffy.', duration: '5 min' },
        { step: 4, instruction: 'Add eggs one at a time, beating well after each addition. Add vanilla.', duration: '4 min' },
        { step: 5, instruction: 'Fold dry ingredients into wet mixture. Do not overmix.', duration: '3 min' },
        { step: 6, instruction: 'Portion dough onto prepared trays. Bake until golden and a toothpick comes out clean.', duration: '18 min' },
      ],
    };
  }
}
