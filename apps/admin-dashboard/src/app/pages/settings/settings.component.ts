import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import {
  BakePageContainerComponent,
  BakeConfirmationService,
  BakeToastService,
} from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { Category, Product } from '@bake-app/shared-types';
import { forkJoin } from 'rxjs';

interface CategoryView {
  id: string;
  name: string;
  parentId: string | null;
  children?: CategoryView[];
  productCount: number;
}

@Component({
  selector: 'bake-app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatSelectModule,
    BakePageContainerComponent,
  ],
  template: `
    <bake-page-container title="Settings" subtitle="Configure your bakery system">
      <mat-accordion class="settings-accordion" multi>
        <!-- General Settings -->
        <mat-expansion-panel expanded>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon class="panel-icon">store</mat-icon>
              General Settings
            </mat-panel-title>
            <mat-panel-description>
              Bakery name, address, and contact info
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="settings-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Bakery Name</mat-label>
              <input matInput [(ngModel)]="general.bakeryName" placeholder="My Bakery" />
              <mat-icon matPrefix>storefront</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Address</mat-label>
              <textarea
                matInput
                [(ngModel)]="general.address"
                rows="2"
                placeholder="Full bakery address"
              ></textarea>
              <mat-icon matPrefix>location_on</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone Number</mat-label>
              <input matInput [(ngModel)]="general.phone" placeholder="+7 (7xx) xxx-xx-xx" />
              <mat-icon matPrefix>phone</mat-icon>
            </mat-form-field>

            <div class="form-actions">
              <button mat-flat-button class="save-btn" (click)="onSaveGeneral()">
                <mat-icon>save</mat-icon>
                Save Changes
              </button>
            </div>
          </div>
        </mat-expansion-panel>

        <!-- Tax Configuration -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon class="panel-icon">receipt</mat-icon>
              Tax Configuration
            </mat-panel-title>
            <mat-panel-description>
              Tax rates and calculation settings
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="settings-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tax Name</mat-label>
              <input matInput [(ngModel)]="tax.name" placeholder="VAT" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tax Rate (%)</mat-label>
              <input
                matInput
                type="number"
                [(ngModel)]="tax.rate"
                placeholder="12"
              />
              <span matSuffix>%</span>
            </mat-form-field>

            <mat-slide-toggle
              [(ngModel)]="tax.included"
              color="primary"
              class="toggle-field"
            >
              Tax included in displayed prices
            </mat-slide-toggle>

            <div class="form-actions">
              <button mat-flat-button class="save-btn" (click)="onSaveTax()">
                <mat-icon>save</mat-icon>
                Save Changes
              </button>
            </div>
          </div>
        </mat-expansion-panel>

        <!-- POS Settings -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon class="panel-icon">point_of_sale</mat-icon>
              POS Settings
            </mat-panel-title>
            <mat-panel-description>
              Receipt and point-of-sale configuration
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="settings-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Receipt Header</mat-label>
              <textarea
                matInput
                [(ngModel)]="pos.receiptHeader"
                rows="3"
                placeholder="Text displayed at the top of receipts"
              ></textarea>
            </mat-form-field>

            <mat-slide-toggle
              [(ngModel)]="pos.autoPrint"
              color="primary"
              class="toggle-field"
            >
              Auto-print receipt after order completion
            </mat-slide-toggle>

            <div class="form-actions">
              <button mat-flat-button class="save-btn" (click)="onSavePos()">
                <mat-icon>save</mat-icon>
                Save Changes
              </button>
            </div>
          </div>
        </mat-expansion-panel>

        <!-- Menu Categories -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon class="panel-icon">restaurant_menu</mat-icon>
              Menu Categories
            </mat-panel-title>
            <mat-panel-description>
              Categories for products and recipes
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="category-layout">
            <div class="category-form-section">
              <div class="section-title">
                {{ editingMenuCategory ? 'Edit Category' : 'Add Category' }}
              </div>
              <form (ngSubmit)="onSaveMenuCategory()" class="settings-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Category Name</mat-label>
                  <input
                    matInput
                    [(ngModel)]="menuFormName"
                    name="menuName"
                    placeholder="e.g., Bread"
                    required
                  />
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Parent Category</mat-label>
                  <mat-select [(ngModel)]="menuFormParentId" name="menuParentId">
                    <mat-option [value]="null">None (Top Level)</mat-option>
                    <mat-option
                      *ngFor="let cat of menuTopLevelCategories"
                      [value]="cat.id"
                      [disabled]="cat.id === editingMenuCategory?.id"
                    >
                      {{ cat.name }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <div class="form-actions">
                  <button
                    mat-button
                    type="button"
                    *ngIf="editingMenuCategory"
                    (click)="cancelMenuEdit()"
                  >
                    Cancel
                  </button>
                  <button mat-flat-button type="submit" class="save-btn">
                    {{ editingMenuCategory ? 'Update' : 'Add' }}
                  </button>
                </div>
              </form>
            </div>

            <mat-divider [vertical]="true" class="category-divider"></mat-divider>

            <div class="category-list-section">
              <mat-nav-list class="category-list">
                <ng-container *ngFor="let category of menuCategoriesTree">
                  <mat-list-item class="parent-item">
                    <mat-icon matListItemIcon class="category-icon">folder</mat-icon>
                    <div matListItemTitle class="item-content">
                      <span class="category-name">{{ category.name }}</span>
                      <span class="product-count">{{ category.productCount }} products</span>
                    </div>
                    <div matListItemMeta class="item-actions">
                      <button mat-icon-button (click)="onEditMenuCategory(category)">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="onDeleteMenuCategory(category)">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </mat-list-item>
                  <ng-container *ngIf="category.children?.length">
                    <mat-list-item
                      *ngFor="let child of category.children"
                      class="child-item"
                    >
                      <mat-icon matListItemIcon class="child-icon">subdirectory_arrow_right</mat-icon>
                      <div matListItemTitle class="item-content">
                        <span class="category-name">{{ child.name }}</span>
                        <span class="product-count">{{ child.productCount }} products</span>
                      </div>
                      <div matListItemMeta class="item-actions">
                        <button mat-icon-button (click)="onEditMenuCategory(child)">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="onDeleteMenuCategory(child)">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </mat-list-item>
                  </ng-container>
                </ng-container>
                <div *ngIf="menuCategories.length === 0" class="empty-state">
                  No menu categories yet.
                </div>
              </mat-nav-list>
            </div>
          </div>
        </mat-expansion-panel>

        <!-- Ingredient Categories -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon class="panel-icon">grain</mat-icon>
              Ingredient Categories
            </mat-panel-title>
            <mat-panel-description>
              Categories for inventory and ingredients
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="category-layout">
            <div class="category-form-section">
              <div class="section-title">
                {{ editingIngCategory ? 'Edit Category' : 'Add Category' }}
              </div>
              <form (ngSubmit)="onSaveIngCategory()" class="settings-form">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Category Name</mat-label>
                  <input
                    matInput
                    [(ngModel)]="ingFormName"
                    name="ingName"
                    placeholder="e.g., Dairy"
                    required
                  />
                </mat-form-field>

                <div class="form-actions">
                  <button
                    mat-button
                    type="button"
                    *ngIf="editingIngCategory"
                    (click)="cancelIngEdit()"
                  >
                    Cancel
                  </button>
                  <button mat-flat-button type="submit" class="save-btn">
                    {{ editingIngCategory ? 'Update' : 'Add' }}
                  </button>
                </div>
              </form>
            </div>

            <mat-divider [vertical]="true" class="category-divider"></mat-divider>

            <div class="category-list-section">
              <mat-nav-list class="category-list">
                <mat-list-item *ngFor="let cat of ingCategories" class="parent-item">
                  <mat-icon matListItemIcon class="category-icon">label</mat-icon>
                  <span matListItemTitle class="category-name">{{ cat.name }}</span>
                  <div matListItemMeta class="item-actions">
                    <button mat-icon-button (click)="onEditIngCategory(cat)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="onDeleteIngCategory(cat)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </mat-list-item>
                <div *ngIf="ingCategories.length === 0" class="empty-state">
                  No ingredient categories yet.
                </div>
              </mat-nav-list>
            </div>
          </div>
        </mat-expansion-panel>
      </mat-accordion>
    </bake-page-container>
  `,
  styles: [
    `
      .settings-accordion {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      ::ng-deep .settings-accordion .mat-expansion-panel {
        border-radius: 12px !important;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
      }

      .panel-icon {
        margin-right: 12px;
        color: #8b4513;
      }

      ::ng-deep .mat-expansion-panel-header-title {
        align-items: center;
        font-weight: 600;
        color: #3e2723;
      }

      ::ng-deep .mat-expansion-panel-header-description {
        align-items: center;
        color: #8d6e63;
      }

      .settings-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 0;
      }

      .full-width {
        width: 100%;
      }

      .toggle-field {
        margin: 8px 0 16px;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 8px;
      }

      .save-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }

      /* Category panels */
      .category-layout {
        display: grid;
        grid-template-columns: 300px auto 1fr;
        gap: 0;
        align-items: start;
        min-height: 200px;
      }

      .category-form-section {
        padding-right: 24px;
      }

      .category-divider {
        height: 100%;
      }

      .category-list-section {
        padding-left: 24px;
      }

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #3e2723;
        margin-bottom: 12px;
      }

      .category-list {
        padding: 0;
      }

      .parent-item {
        font-weight: 500;
      }

      .child-item {
        padding-left: 24px;
      }

      .category-icon {
        color: #8b4513;
      }

      .child-icon {
        color: #8d6e63;
        font-size: 20px;
      }

      .item-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }

      .category-name {
        font-weight: 500;
        color: #3e2723;
      }

      .product-count {
        font-size: 12px;
        color: #8d6e63;
        background-color: #faf3e8;
        padding: 2px 8px;
        border-radius: 12px;
      }

      .item-actions {
        display: flex;
        gap: 0;
      }

      .empty-state {
        text-align: center;
        color: #9e9e9e;
        padding: 24px;
        font-style: italic;
      }

      @media (max-width: 768px) {
        .category-layout {
          grid-template-columns: 1fr;
        }

        .category-divider {
          display: none;
        }

        .category-form-section {
          padding-right: 0;
        }

        .category-list-section {
          padding-left: 0;
        }
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  // General settings
  general = {
    bakeryName: 'Sweet Bake Almaty',
    address: 'ul. Abaya 52, Almaty, Kazakhstan 050000',
    phone: '+7 (727) 123-45-67',
  };

  tax = {
    name: 'VAT',
    rate: 12,
    included: true,
  };

  pos = {
    receiptHeader:
      'Sweet Bake Almaty\nul. Abaya 52\nTel: +7 (727) 123-45-67\nThank you for your visit!',
    autoPrint: true,
  };

  // Menu categories
  menuCategories: CategoryView[] = [];
  menuFormName = '';
  menuFormParentId: string | null = null;
  editingMenuCategory: CategoryView | null = null;
  private menuLastUsedParentId: string | null = null;

  // Ingredient categories
  ingCategories: CategoryView[] = [];
  ingFormName = '';
  editingIngCategory: CategoryView | null = null;

  constructor(
    private toastService: BakeToastService,
    private confirmService: BakeConfirmationService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.loadSettings();
    this.loadMenuCategories();
    this.loadIngCategories();
  }

  // --- Settings ---

  private loadSettings(): void {
    forkJoin({
      general: this.apiClient.get<Record<string, unknown>>('/v1/settings/general'),
      tax: this.apiClient.get<Record<string, unknown>>('/v1/settings/tax'),
      pos: this.apiClient.get<Record<string, unknown>>('/v1/settings/pos'),
    }).subscribe({
      next: (settings) => {
        if (settings.general && Object.keys(settings.general).length) {
          this.general = {
            bakeryName:
              (settings.general['bakeryName'] as string) || this.general.bakeryName,
            address: (settings.general['address'] as string) || this.general.address,
            phone: (settings.general['phone'] as string) || this.general.phone,
          };
        }
        if (settings.tax && Object.keys(settings.tax).length) {
          this.tax = {
            name: (settings.tax['taxName'] as string) || this.tax.name,
            rate: (settings.tax['taxRate'] as number) ?? this.tax.rate,
            included:
              settings.tax['taxInclusive'] != null
                ? (settings.tax['taxInclusive'] as boolean)
                : this.tax.included,
          };
        }
        if (settings.pos && Object.keys(settings.pos).length) {
          this.pos = {
            receiptHeader:
              (settings.pos['receiptHeader'] as string) || this.pos.receiptHeader,
            autoPrint:
              settings.pos['autoPrint'] != null
                ? (settings.pos['autoPrint'] as boolean)
                : this.pos.autoPrint,
          };
        }
      },
      error: () => {
        this.toastService.error('Failed to load settings');
      },
    });
  }

  onSaveGeneral(): void {
    this.apiClient
      .put('/v1/settings/general', {
        bakeryName: this.general.bakeryName,
        address: this.general.address,
        phone: this.general.phone,
      })
      .subscribe({
        next: () => this.toastService.success('General settings saved successfully'),
        error: () => this.toastService.error('Failed to save general settings'),
      });
  }

  onSaveTax(): void {
    this.apiClient
      .put('/v1/settings/tax', {
        taxName: this.tax.name,
        taxRate: this.tax.rate,
        taxInclusive: this.tax.included,
      })
      .subscribe({
        next: () => this.toastService.success('Tax configuration saved successfully'),
        error: () => this.toastService.error('Failed to save tax configuration'),
      });
  }

  onSavePos(): void {
    this.apiClient
      .put('/v1/settings/pos', {
        receiptHeader: this.pos.receiptHeader,
        autoPrint: this.pos.autoPrint,
      })
      .subscribe({
        next: () => this.toastService.success('POS settings saved successfully'),
        error: () => this.toastService.error('Failed to save POS settings'),
      });
  }

  // --- Menu Categories ---

  private loadMenuCategories(): void {
    forkJoin({
      categories: this.apiClient.get<Category[]>('/v1/categories?type=menu'),
      products: this.apiClient.get<{ data: Product[] }>('/v1/products?limit=100'),
    }).subscribe({
      next: ({ categories: cats, products: productsRes }) => {
        const countMap: Record<string, number> = {};
        for (const product of productsRes.data) {
          if (product.categoryId) {
            countMap[product.categoryId] = (countMap[product.categoryId] || 0) + 1;
          }
        }
        this.menuCategories = cats.map((c) => ({
          id: c.id,
          name: c.name,
          parentId: c.parentId || null,
          productCount: countMap[c.id] || 0,
        }));
      },
      error: () => this.toastService.error('Failed to load menu categories'),
    });
  }

  get menuTopLevelCategories(): CategoryView[] {
    return this.menuCategories.filter((c) => c.parentId === null);
  }

  get menuCategoriesTree(): CategoryView[] {
    const topLevel = this.menuCategories.filter((c) => c.parentId === null);
    return topLevel.map((parent) => ({
      ...parent,
      children: this.menuCategories.filter((c) => c.parentId === parent.id),
    }));
  }

  onSaveMenuCategory(): void {
    if (!this.menuFormName.trim()) return;

    const dto = {
      name: this.menuFormName,
      parentId: this.menuFormParentId || undefined,
      type: 'menu',
    };

    if (this.editingMenuCategory) {
      this.apiClient
        .put<Category>(`/v1/categories/${this.editingMenuCategory.id}`, dto)
        .subscribe({
          next: (updated) => {
            this.menuCategories = this.menuCategories.map((c) =>
              c.id === this.editingMenuCategory!.id
                ? { ...c, name: updated.name, parentId: updated.parentId || null }
                : c,
            );
            this.toastService.success('Category updated');
            this.cancelMenuEdit();
          },
          error: () => this.toastService.error('Failed to update category'),
        });
    } else {
      this.apiClient.post<Category>('/v1/categories', dto).subscribe({
        next: (created) => {
          this.menuCategories = [
            ...this.menuCategories,
            {
              id: created.id,
              name: created.name,
              parentId: created.parentId || null,
              productCount: 0,
            },
          ];
          this.toastService.success('Category created');
          this.menuLastUsedParentId = this.menuFormParentId;
          this.menuFormName = '';
          this.menuFormParentId = this.menuLastUsedParentId;
        },
        error: () => this.toastService.error('Failed to create category'),
      });
    }
  }

  onEditMenuCategory(category: CategoryView): void {
    this.editingMenuCategory = category;
    this.menuFormName = category.name;
    this.menuFormParentId = category.parentId;
  }

  cancelMenuEdit(): void {
    this.editingMenuCategory = null;
    this.menuFormName = '';
    this.menuFormParentId = this.menuLastUsedParentId;
  }

  onDeleteMenuCategory(category: CategoryView): void {
    const hasChildren = this.menuCategories.some((c) => c.parentId === category.id);
    const message = hasChildren
      ? `"${category.name}" has subcategories. Deleting it will also remove all subcategories. Continue?`
      : `Are you sure you want to delete "${category.name}"?`;

    this.confirmService
      .confirm({
        title: 'Delete Category',
        message,
        confirmText: 'Delete',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.apiClient.delete(`/v1/categories/${category.id}`).subscribe({
            next: () => {
              this.menuCategories = this.menuCategories.filter(
                (c) => c.id !== category.id && c.parentId !== category.id,
              );
              this.toastService.success('Category deleted');
              if (this.editingMenuCategory?.id === category.id) {
                this.cancelMenuEdit();
              }
            },
            error: () => this.toastService.error('Failed to delete category'),
          });
        }
      });
  }

  // --- Ingredient Categories ---

  private loadIngCategories(): void {
    this.apiClient.get<Category[]>('/v1/categories?type=ingredient').subscribe({
      next: (cats) => {
        this.ingCategories = cats.map((c) => ({
          id: c.id,
          name: c.name,
          parentId: null,
          productCount: 0,
        }));
      },
      error: () => this.toastService.error('Failed to load ingredient categories'),
    });
  }

  onSaveIngCategory(): void {
    if (!this.ingFormName.trim()) return;

    const dto = { name: this.ingFormName, type: 'ingredient' };

    if (this.editingIngCategory) {
      this.apiClient
        .put<Category>(`/v1/categories/${this.editingIngCategory.id}`, dto)
        .subscribe({
          next: (updated) => {
            this.ingCategories = this.ingCategories.map((c) =>
              c.id === this.editingIngCategory!.id ? { ...c, name: updated.name } : c,
            );
            this.toastService.success('Category updated');
            this.cancelIngEdit();
          },
          error: () => this.toastService.error('Failed to update category'),
        });
    } else {
      this.apiClient.post<Category>('/v1/categories', dto).subscribe({
        next: (created) => {
          this.ingCategories = [
            ...this.ingCategories,
            { id: created.id, name: created.name, parentId: null, productCount: 0 },
          ];
          this.toastService.success('Category created');
          this.ingFormName = '';
        },
        error: () => this.toastService.error('Failed to create category'),
      });
    }
  }

  onEditIngCategory(category: CategoryView): void {
    this.editingIngCategory = category;
    this.ingFormName = category.name;
  }

  cancelIngEdit(): void {
    this.editingIngCategory = null;
    this.ingFormName = '';
  }

  onDeleteIngCategory(category: CategoryView): void {
    this.confirmService
      .confirm({
        title: 'Delete Category',
        message: `Are you sure you want to delete "${category.name}"?`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.apiClient.delete(`/v1/categories/${category.id}`).subscribe({
            next: () => {
              this.ingCategories = this.ingCategories.filter(
                (c) => c.id !== category.id,
              );
              this.toastService.success('Category deleted');
              if (this.editingIngCategory?.id === category.id) {
                this.cancelIngEdit();
              }
            },
            error: () => this.toastService.error('Failed to delete category'),
          });
        }
      });
  }
}
