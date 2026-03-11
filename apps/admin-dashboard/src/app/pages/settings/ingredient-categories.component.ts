import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BakeConfirmationService, BakeToastService } from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { IngredientCategory } from '@bake-app/shared-types';

interface CategoryView {
  id: string;
  name: string;
}

@Component({
  selector: 'bake-ingredient-categories',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
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
              placeholder="e.g., Dairy"
            />
          </mat-form-field>

          <div class="form-actions">
            <button mat-button type="button" *ngIf="editing" (click)="cancelEdit()">
              Cancel
            </button>
            <button mat-flat-button type="submit" class="save-btn" [disabled]="saving">
              {{ editing ? 'Update' : 'Add' }}
            </button>
          </div>
        </form>
      </div>

      <mat-divider [vertical]="true" class="category-divider"></mat-divider>

      <div class="category-list-section">
        <mat-nav-list class="category-list">
          <mat-list-item *ngFor="let cat of categories" class="parent-item">
            <mat-icon matListItemIcon class="category-icon">label</mat-icon>
            <span matListItemTitle class="category-name">{{ cat.name }}</span>
            <div matListItemMeta class="item-actions">
              <button mat-icon-button (click)="onEdit(cat)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="onDelete(cat)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </mat-list-item>
          <div *ngIf="categories.length === 0" class="empty-state">
            No ingredient categories yet.
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
      .category-icon {
        color: #8b4513;
      }
      .category-name {
        font-weight: 500;
        color: #3e2723;
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
export class IngredientCategoriesComponent implements OnInit {
  loading = false;
  saving = false;
  categories: CategoryView[] = [];
  formName = '';
  editing: CategoryView | null = null;

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
    this.apiClient.get<IngredientCategory[]>('/v1/ingredient-categories').subscribe({
      next: (cats) => {
        this.loading = false;
        this.categories = cats.map((c) => ({ id: c.id, name: c.name }));
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Failed to load ingredient categories');
      },
    });
  }

  onSave(): void {
    if (!this.formName.trim()) return;

    const dto = { name: this.formName };
    this.saving = true;

    if (this.editing) {
      this.apiClient
        .put<IngredientCategory>(`/v1/ingredient-categories/${this.editing.id}`, dto)
        .subscribe({
          next: (updated) => {
            this.saving = false;
            this.categories = this.categories.map((c) =>
              c.id === this.editing!.id ? { ...c, name: updated.name } : c,
            );
            this.toastService.success('Category updated');
            this.cancelEdit();
          },
          error: () => {
            this.saving = false;
            this.toastService.error('Failed to update category');
          },
        });
    } else {
      this.apiClient.post<IngredientCategory>('/v1/ingredient-categories', dto).subscribe({
        next: (created) => {
          this.saving = false;
          this.categories = [
            ...this.categories,
            { id: created.id, name: created.name },
          ];
          this.toastService.success('Category created');
          this.formName = '';
        },
        error: () => {
          this.saving = false;
          this.toastService.error('Failed to create category');
        },
      });
    }
  }

  onEdit(category: CategoryView): void {
    this.editing = category;
    this.formName = category.name;
  }

  cancelEdit(): void {
    this.editing = null;
    this.formName = '';
  }

  onDelete(category: CategoryView): void {
    this.confirmService
      .confirm({
        title: 'Delete Category',
        message: `Are you sure you want to delete "${category.name}"?`,
        confirmText: 'Delete',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.apiClient.delete(`/v1/ingredient-categories/${category.id}`).subscribe({
            next: () => {
              this.categories = this.categories.filter((c) => c.id !== category.id);
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
