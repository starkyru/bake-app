import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BakeConfirmationService, BakeToastService } from '@bake-app/ui-components';
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
  selector: 'bake-menu-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatProgressBarModule,
  ],
  template: `
    <mat-progress-bar *ngIf="loading" mode="indeterminate" class="settings-loading"></mat-progress-bar>
    <div class="category-layout">
      <div class="category-form-section">
        <div class="section-title">
          {{ editing ? 'Edit Category' : 'Add Category' }}
        </div>
        <form (ngSubmit)="onSave()" class="form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Category Name</mat-label>
            <input
              matInput
              [(ngModel)]="formName"
              name="name"
              placeholder="e.g., Bread"
            />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Parent Category</mat-label>
            <mat-select [(ngModel)]="formParentId" name="parentId">
              <mat-option value="">None (Top Level)</mat-option>
              <mat-option
                *ngFor="let cat of topLevelCategories"
                [value]="cat.id"
                [disabled]="cat.id === editing?.id"
              >
                {{ cat.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <div class="form-actions">
            <button mat-button type="button" *ngIf="editing" (click)="cancelEdit()">
              Cancel
            </button>
            <button mat-flat-button type="submit" class="save-btn">
              {{ editing ? 'Update' : 'Add' }}
            </button>
          </div>
        </form>
      </div>

      <mat-divider [vertical]="true" class="category-divider"></mat-divider>

      <div class="category-list-section">
        <mat-nav-list class="category-list">
          <ng-container *ngFor="let category of categoriesTree">
            <mat-list-item class="parent-item">
              <mat-icon matListItemIcon class="category-icon">folder</mat-icon>
              <div matListItemTitle class="item-content">
                <span class="category-name">{{ category.name }}</span>
                <span class="product-count">{{ category.productCount }} products</span>
              </div>
              <div matListItemMeta class="item-actions">
                <button mat-icon-button (click)="onEdit(category)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="onDelete(category)">
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
                  <button mat-icon-button (click)="onEdit(child)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="onDelete(child)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </mat-list-item>
            </ng-container>
          </ng-container>
          <div *ngIf="categories.length === 0" class="empty-state">
            No menu categories yet.
          </div>
        </mat-nav-list>
      </div>
    </div>
  `,
  styles: [
    `
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
      .form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 0;
      }
      .full-width {
        width: 100%;
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
      .settings-loading {
        margin-bottom: 8px;
      }
    `,
  ],
})
export class MenuCategoriesComponent implements OnInit {
  loading = false;
  categories: CategoryView[] = [];
  formName = '';
  formParentId = '';
  editing: CategoryView | null = null;
  private lastUsedParentId = '';

  constructor(
    private toastService: BakeToastService,
    private confirmService: BakeConfirmationService,
    private apiClient: ApiClientService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    forkJoin({
      categories: this.apiClient.get<Category[]>('/v1/categories?type=menu'),
      products: this.apiClient.get<{ data: Product[] }>('/v1/products?limit=100'),
    }).subscribe({
      next: ({ categories: cats, products: productsRes }) => {
        this.loading = false;
        const countMap: Record<string, number> = {};
        for (const product of productsRes.data) {
          if (product.categoryId) {
            countMap[product.categoryId] = (countMap[product.categoryId] || 0) + 1;
          }
        }
        this.categories = cats.map((c) => ({
          id: c.id,
          name: c.name,
          parentId: c.parentId || null,
          productCount: countMap[c.id] || 0,
        }));
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Failed to load menu categories');
      },
    });
  }

  get topLevelCategories(): CategoryView[] {
    return this.categories.filter((c) => c.parentId === null);
  }

  get categoriesTree(): CategoryView[] {
    const topLevel = this.categories.filter((c) => c.parentId === null);
    return topLevel.map((parent) => ({
      ...parent,
      children: this.categories.filter((c) => c.parentId === parent.id),
    }));
  }

  onSave(): void {
    if (!this.formName.trim()) return;

    const dto = {
      name: this.formName,
      parentId: this.formParentId || undefined,
      type: 'menu',
    };

    if (this.editing) {
      this.apiClient
        .put<Category>(`/v1/categories/${this.editing.id}`, dto)
        .subscribe({
          next: (updated) => {
            this.categories = this.categories.map((c) =>
              c.id === this.editing!.id
                ? { ...c, name: updated.name, parentId: updated.parentId || null }
                : c,
            );
            this.toastService.success('Category updated');
            this.cancelEdit();
          },
          error: () => this.toastService.error('Failed to update category'),
        });
    } else {
      this.apiClient.post<Category>('/v1/categories', dto).subscribe({
        next: (created) => {
          this.categories = [
            ...this.categories,
            {
              id: created.id,
              name: created.name,
              parentId: created.parentId || null,
              productCount: 0,
            },
          ];
          this.toastService.success('Category created');
          this.lastUsedParentId = this.formParentId;
          this.formName = '';
        },
        error: () => this.toastService.error('Failed to create category'),
      });
    }
  }

  onEdit(category: CategoryView): void {
    this.editing = category;
    this.formName = category.name;
    this.formParentId = category.parentId || '';
  }

  cancelEdit(): void {
    this.editing = null;
    this.formName = '';
    this.formParentId = this.lastUsedParentId;
  }

  onDelete(category: CategoryView): void {
    const hasChildren = this.categories.some((c) => c.parentId === category.id);
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
              this.categories = this.categories.filter(
                (c) => c.id !== category.id && c.parentId !== category.id,
              );
              this.toastService.success('Category deleted');
              if (this.editing?.id === category.id) {
                this.cancelEdit();
              }
            },
            error: () => this.toastService.error('Failed to delete category'),
          });
        }
      });
  }
}
