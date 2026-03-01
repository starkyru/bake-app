import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import {
  BakePageContainerComponent,
  BakeConfirmationService,
  BakeToastService,
} from '@bake-app/ui-components';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children?: Category[];
  productCount: number;
}

@Component({
  selector: 'bake-app-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatDividerModule,
    BakePageContainerComponent,
  ],
  template: `
    <bake-page-container title="Categories" subtitle="Organize products into categories">
      <div class="categories-layout">
        <mat-card class="category-form-card">
          <mat-card-header>
            <mat-card-title class="form-title">
              {{ editingCategory ? 'Edit Category' : 'Add Category' }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form (ngSubmit)="onSaveCategory()" class="category-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Category Name</mat-label>
                <input
                  matInput
                  [(ngModel)]="formName"
                  name="name"
                  placeholder="e.g., Bread"
                  required
                />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Parent Category</mat-label>
                <mat-select [(ngModel)]="formParentId" name="parentId">
                  <mat-option [value]="null">None (Top Level)</mat-option>
                  <mat-option
                    *ngFor="let cat of topLevelCategories"
                    [value]="cat.id"
                    [disabled]="cat.id === editingCategory?.id"
                  >
                    {{ cat.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>

              <div class="form-actions">
                <button
                  mat-button
                  type="button"
                  *ngIf="editingCategory"
                  (click)="cancelEdit()"
                >
                  Cancel
                </button>
                <button mat-flat-button type="submit" class="save-btn">
                  {{ editingCategory ? 'Update' : 'Add Category' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <mat-card class="category-list-card">
          <mat-card-header>
            <mat-card-title class="list-title">All Categories</mat-card-title>
          </mat-card-header>
          <mat-card-content>
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

                <mat-divider></mat-divider>
              </ng-container>
            </mat-nav-list>
          </mat-card-content>
        </mat-card>
      </div>
    </bake-page-container>
  `,
  styles: [
    `
      .categories-layout {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 24px;
        align-items: start;
      }

      .category-form-card,
      .category-list-card {
        border-radius: 12px;
      }

      .form-title,
      .list-title {
        font-size: 16px;
        font-weight: 600;
        color: #3e2723;
      }

      .category-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-top: 12px;
      }

      .full-width {
        width: 100%;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
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

      @media (max-width: 768px) {
        .categories-layout {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CategoriesComponent {
  categories: Category[] = [
    { id: '1', name: 'Bread', parentId: null, productCount: 5 },
    { id: '2', name: 'Pastry', parentId: null, productCount: 8 },
    { id: '3', name: 'Cake', parentId: null, productCount: 6 },
    { id: '4', name: 'Cookie', parentId: null, productCount: 4 },
    { id: '5', name: 'Beverage', parentId: null, productCount: 7 },
    { id: '6', name: 'Sandwich', parentId: null, productCount: 3 },
    { id: '7', name: 'Savory', parentId: null, productCount: 5 },
    { id: '8', name: 'Sourdough', parentId: '1', productCount: 2 },
    { id: '9', name: 'White Bread', parentId: '1', productCount: 3 },
    { id: '10', name: 'Croissants', parentId: '2', productCount: 3 },
    { id: '11', name: 'Danish', parentId: '2', productCount: 2 },
    { id: '12', name: 'Coffee', parentId: '5', productCount: 4 },
    { id: '13', name: 'Tea', parentId: '5', productCount: 3 },
  ];

  formName = '';
  formParentId: string | null = null;
  editingCategory: Category | null = null;

  constructor(
    private confirmService: BakeConfirmationService,
    private toastService: BakeToastService
  ) {}

  get topLevelCategories(): Category[] {
    return this.categories.filter((c) => c.parentId === null);
  }

  get categoriesTree(): Category[] {
    const topLevel = this.categories.filter((c) => c.parentId === null);
    return topLevel.map((parent) => ({
      ...parent,
      children: this.categories.filter((c) => c.parentId === parent.id),
    }));
  }

  onSaveCategory(): void {
    if (!this.formName.trim()) return;

    if (this.editingCategory) {
      this.categories = this.categories.map((c) =>
        c.id === this.editingCategory!.id
          ? { ...c, name: this.formName, parentId: this.formParentId }
          : c
      );
      this.toastService.success('Category updated successfully');
      this.cancelEdit();
    } else {
      const newCategory: Category = {
        id: String(Date.now()),
        name: this.formName,
        parentId: this.formParentId,
        productCount: 0,
      };
      this.categories = [...this.categories, newCategory];
      this.toastService.success('Category created successfully');
      this.formName = '';
      this.formParentId = null;
    }
  }

  onEdit(category: Category): void {
    this.editingCategory = category;
    this.formName = category.name;
    this.formParentId = category.parentId;
  }

  cancelEdit(): void {
    this.editingCategory = null;
    this.formName = '';
    this.formParentId = null;
  }

  onDelete(category: Category): void {
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
          this.categories = this.categories.filter(
            (c) => c.id !== category.id && c.parentId !== category.id
          );
          this.toastService.success('Category deleted successfully');

          if (this.editingCategory?.id === category.id) {
            this.cancelEdit();
          }
        }
      });
  }
}
