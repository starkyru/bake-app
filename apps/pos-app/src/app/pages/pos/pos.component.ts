import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BakeProductCardComponent, BakeCurrencyDisplayComponent } from '@bake-app/ui-components';
import {
  PaymentDialogComponent,
  PaymentDialogData,
  PaymentDialogResult,
} from './payment-dialog.component';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const SAMPLE_PRODUCTS: Product[] = [
  // Coffee
  { id: 1, name: 'Espresso', price: 800, category: 'Coffee' },
  { id: 2, name: 'Cappuccino', price: 1200, category: 'Coffee' },
  { id: 3, name: 'Latte', price: 1400, category: 'Coffee' },
  { id: 4, name: 'Americano', price: 900, category: 'Coffee' },
  { id: 5, name: 'Flat White', price: 1300, category: 'Coffee' },
  { id: 6, name: 'Mocha', price: 1500, category: 'Coffee' },

  // Pastries
  { id: 7, name: 'Croissant', price: 650, category: 'Pastries' },
  { id: 8, name: 'Pain au Chocolat', price: 750, category: 'Pastries' },
  { id: 9, name: 'Danish Pastry', price: 700, category: 'Pastries' },
  { id: 10, name: 'Cinnamon Roll', price: 800, category: 'Pastries' },
  { id: 11, name: 'Muffin', price: 600, category: 'Pastries' },
  { id: 12, name: 'Scone', price: 550, category: 'Pastries' },

  // Bread
  { id: 13, name: 'Sourdough Loaf', price: 1200, category: 'Bread' },
  { id: 14, name: 'Baguette', price: 600, category: 'Bread' },
  { id: 15, name: 'Rye Bread', price: 900, category: 'Bread' },
  { id: 16, name: 'Ciabatta', price: 700, category: 'Bread' },
  { id: 17, name: 'Focaccia', price: 850, category: 'Bread' },

  // Sandwiches
  { id: 18, name: 'Turkey Club', price: 1800, category: 'Sandwiches' },
  { id: 19, name: 'Caprese Panini', price: 1600, category: 'Sandwiches' },
  { id: 20, name: 'Ham & Cheese', price: 1500, category: 'Sandwiches' },
  { id: 21, name: 'Veggie Wrap', price: 1400, category: 'Sandwiches' },
  { id: 22, name: 'Chicken Avocado', price: 1900, category: 'Sandwiches' },

  // Drinks
  { id: 23, name: 'Fresh Orange Juice', price: 1000, category: 'Drinks' },
  { id: 24, name: 'Green Smoothie', price: 1300, category: 'Drinks' },
  { id: 25, name: 'Hot Chocolate', price: 1100, category: 'Drinks' },
  { id: 26, name: 'Chai Latte', price: 1200, category: 'Drinks' },
  { id: 27, name: 'Iced Tea', price: 800, category: 'Drinks' },

  // Desserts
  { id: 28, name: 'Tiramisu', price: 1400, category: 'Desserts' },
  { id: 29, name: 'Cheesecake', price: 1300, category: 'Desserts' },
  { id: 30, name: 'Eclair', price: 900, category: 'Desserts' },
  { id: 31, name: 'Macaron (3pc)', price: 1100, category: 'Desserts' },
  { id: 32, name: 'Brownie', price: 700, category: 'Desserts' },
];

const CATEGORIES = [
  'Coffee',
  'Pastries',
  'Bread',
  'Sandwiches',
  'Drinks',
  'Desserts',
];

@Component({
  selector: 'bake-app-pos',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatBadgeModule,
    MatDialogModule,
    MatSnackBarModule,
    BakeProductCardComponent,
    BakeCurrencyDisplayComponent,
  ],
  template: `
    <div class="pos-layout">
      <!-- Left Panel: Product Selection -->
      <div class="products-panel">
        <mat-tab-group
          class="category-tabs"
          [(selectedIndex)]="selectedCategoryIndex"
          animationDuration="150ms"
        >
          <mat-tab *ngFor="let category of categories">
            <ng-template mat-tab-label>
              <mat-icon>{{ getCategoryIcon(category) }}</mat-icon>
              <span class="category-label">{{ category }}</span>
            </ng-template>
          </mat-tab>
        </mat-tab-group>

        <div class="product-grid">
          <bake-product-card
            *ngFor="let product of filteredProducts"
            [name]="product.name"
            [price]="product.price"
            [category]="product.category"
            (addToCart)="addToCart(product)"
          ></bake-product-card>
        </div>
      </div>

      <!-- Right Panel: Cart -->
      <div class="cart-panel">
        <div class="cart-header">
          <mat-icon>shopping_cart</mat-icon>
          <h2>Current Order</h2>
          <span class="item-count" *ngIf="cart.length > 0">
            {{ totalItems }} item{{ totalItems !== 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Empty cart -->
        <div class="cart-empty" *ngIf="cart.length === 0">
          <mat-icon class="empty-icon">add_shopping_cart</mat-icon>
          <p>No items yet</p>
          <p class="empty-hint">Tap a product to add it</p>
        </div>

        <!-- Cart items -->
        <div class="cart-items" *ngIf="cart.length > 0">
          <div class="cart-item" *ngFor="let item of cart; let i = index">
            <div class="item-info">
              <span class="item-name">{{ item.product.name }}</span>
              <span class="item-price">
                ${{ item.product.price * item.quantity | number: '1.0-0' }}
              </span>
            </div>
            <div class="item-controls">
              <button
                mat-icon-button
                class="qty-btn"
                (click)="decrementItem(i)"
              >
                <mat-icon>{{ item.quantity === 1 ? 'delete' : 'remove' }}</mat-icon>
              </button>
              <span class="qty-value">{{ item.quantity }}</span>
              <button
                mat-icon-button
                class="qty-btn"
                (click)="incrementItem(i)"
              >
                <mat-icon>add</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Cart totals -->
        <div class="cart-totals" *ngIf="cart.length > 0">
          <div class="total-row">
            <span>Subtotal</span>
            <span class="total-value">${{ subtotal | number: '1.0-0' }}</span>
          </div>
          <div class="total-row tax-row">
            <span>Tax (12%)</span>
            <span class="total-value">${{ tax | number: '1.0-0' }}</span>
          </div>
          <div class="total-row grand-total">
            <span>Total</span>
            <bake-currency-display
              [amount]="total"
              size="large"
            ></bake-currency-display>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="cart-actions" *ngIf="cart.length > 0">
          <button mat-stroked-button class="clear-btn" (click)="clearCart()">
            <mat-icon>delete_sweep</mat-icon>
            Clear
          </button>
          <button mat-flat-button class="pay-btn" (click)="openPaymentDialog()">
            <mat-icon>payment</mat-icon>
            PAY ${{ total | number: '1.0-0' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .pos-layout {
        display: flex;
        height: calc(100vh - 64px);
        background-color: #faf3e8;
      }

      /* --- Left Panel --- */
      .products-panel {
        flex: 6;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-right: 1px solid #e0d5c7;
      }

      .category-tabs {
        flex-shrink: 0;
        background-color: #fff;
        border-bottom: 1px solid #e0d5c7;
      }

      .category-label {
        margin-left: 6px;
        font-size: 13px;
      }

      .product-grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 12px;
        padding: 16px;
        overflow-y: auto;
        align-content: start;
      }

      /* --- Right Panel --- */
      .cart-panel {
        flex: 4;
        display: flex;
        flex-direction: column;
        background-color: #fff;
        min-width: 340px;
        max-width: 440px;
      }

      .cart-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px 20px;
        border-bottom: 1px solid #f0e6d8;
        color: #3e2723;
      }

      .cart-header h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .item-count {
        margin-left: auto;
        font-size: 13px;
        color: #8d6e63;
        background-color: #faf3e8;
        padding: 2px 10px;
        border-radius: 12px;
      }

      /* Empty state */
      .cart-empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #bcaaa4;
      }

      .empty-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 12px;
      }

      .cart-empty p {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
      }

      .empty-hint {
        font-size: 13px !important;
        font-weight: 400 !important;
        margin-top: 4px !important;
      }

      /* Cart items */
      .cart-items {
        flex: 1;
        overflow-y: auto;
        padding: 8px 0;
      }

      .cart-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 20px;
        border-bottom: 1px solid #f5efe8;
        transition: background-color 0.15s;
      }

      .cart-item:hover {
        background-color: #faf8f5;
      }

      .item-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        min-width: 0;
      }

      .item-name {
        font-size: 14px;
        font-weight: 500;
        color: #3e2723;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .item-price {
        font-size: 13px;
        font-family: 'JetBrains Mono', monospace;
        font-weight: 500;
        color: #8b4513;
      }

      .item-controls {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }

      .qty-btn {
        width: 32px;
        height: 32px;
        color: #5d4037;
      }

      .qty-btn mat-icon {
        font-size: 18px;
      }

      .qty-value {
        min-width: 28px;
        text-align: center;
        font-size: 15px;
        font-weight: 600;
        font-family: 'JetBrains Mono', monospace;
        color: #3e2723;
      }

      /* Totals */
      .cart-totals {
        padding: 16px 20px;
        border-top: 2px solid #f0e6d8;
        background-color: #fdfbf8;
      }

      .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
        font-size: 14px;
        color: #5d4037;
      }

      .total-value {
        font-family: 'JetBrains Mono', monospace;
        font-weight: 500;
      }

      .tax-row {
        font-size: 13px;
        color: #8d6e63;
        padding-bottom: 12px;
        border-bottom: 1px dashed #e0d5c7;
        margin-bottom: 8px;
      }

      .grand-total {
        font-size: 18px;
        font-weight: 700;
        color: #3e2723;
        padding-top: 8px;
      }

      /* Actions */
      .cart-actions {
        display: flex;
        gap: 12px;
        padding: 16px 20px;
        border-top: 1px solid #f0e6d8;
      }

      .clear-btn {
        flex-shrink: 0;
        color: #8d6e63;
        border-color: #d4a574;
      }

      .pay-btn {
        flex: 1;
        height: 52px;
        font-size: 16px;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
        background-color: #2e7d32 !important;
        color: #fff !important;
        border-radius: 10px;
        letter-spacing: 0.5px;
      }

      .pay-btn mat-icon {
        margin-right: 4px;
      }
    `,
  ],
})
export class PosComponent {
  categories = CATEGORIES;
  products = SAMPLE_PRODUCTS;
  cart: CartItem[] = [];
  selectedCategoryIndex = 0;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  get selectedCategory(): string {
    return this.categories[this.selectedCategoryIndex];
  }

  get filteredProducts(): Product[] {
    return this.products.filter((p) => p.category === this.selectedCategory);
  }

  get totalItems(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  get subtotal(): number {
    return this.cart.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  }

  get tax(): number {
    return Math.round(this.subtotal * 0.12);
  }

  get total(): number {
    return this.subtotal + this.tax;
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      Coffee: 'coffee',
      Pastries: 'bakery_dining',
      Bread: 'breakfast_dining',
      Sandwiches: 'lunch_dining',
      Drinks: 'local_bar',
      Desserts: 'cake',
    };
    return icons[category] || 'restaurant';
  }

  addToCart(product: Product): void {
    const existingIndex = this.cart.findIndex(
      (item) => item.product.id === product.id
    );
    if (existingIndex >= 0) {
      this.cart[existingIndex] = {
        ...this.cart[existingIndex],
        quantity: this.cart[existingIndex].quantity + 1,
      };
    } else {
      this.cart = [...this.cart, { product, quantity: 1 }];
    }
  }

  incrementItem(index: number): void {
    this.cart[index] = {
      ...this.cart[index],
      quantity: this.cart[index].quantity + 1,
    };
  }

  decrementItem(index: number): void {
    if (this.cart[index].quantity <= 1) {
      this.removeItem(index);
    } else {
      this.cart[index] = {
        ...this.cart[index],
        quantity: this.cart[index].quantity - 1,
      };
    }
  }

  removeItem(index: number): void {
    this.cart = this.cart.filter((_, i) => i !== index);
  }

  clearCart(): void {
    this.cart = [];
  }

  openPaymentDialog(): void {
    const dialogData: PaymentDialogData = {
      total: this.total,
      itemCount: this.totalItems,
    };

    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '480px',
      disableClose: true,
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result: PaymentDialogResult | undefined) => {
      if (result) {
        this.cart = [];
        this.snackBar.open(
          `Payment successful! ${result.method === 'cash' ? 'Change: $' + result.change : 'Card approved.'}`,
          'OK',
          {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          }
        );
      }
    });
  }
}
