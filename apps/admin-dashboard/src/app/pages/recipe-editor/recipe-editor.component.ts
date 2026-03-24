import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { BakePageContainerComponent, BakeConfirmationService, BakeToastService } from '@bake-app/ui-components';
import { ApiClientService } from '@bake-app/api-client';
import { Recipe, Category as SharedCategory, Ingredient } from '@bake-app/shared-types';
import { CreateIngredientDialogComponent } from '../../shared/ingredient-form/create-ingredient-dialog.component';
import { forkJoin } from 'rxjs';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

interface IngredientRow {
  ingredientId?: string;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  total: number;
  filteredOptions?: Ingredient[];
  hasError?: boolean;
}

interface LinkRow {
  url: string;
  title: string;
  isYoutube: boolean;
  youtubeVideoId: string;
  editing: boolean;
}

interface EstimateCostRow {
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  total: number;
}

interface EstimateCostData {
  rows: EstimateCostRow[];
  totalCost: number;
  costPerYield: number;
  yieldQuantity: number;
  yieldUnit: string;
}

@Component({
  selector: 'bake-app-estimate-cost-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">calculate</mat-icon>
      Estimated Cost
    </h2>
    <mat-dialog-content>
      <table mat-table [dataSource]="data.rows" class="cost-table">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Ingredient</th>
          <td mat-cell *matCellDef="let row">{{ row.name }}</td>
        </ng-container>
        <ng-container matColumnDef="qty">
          <th mat-header-cell *matHeaderCellDef>Qty</th>
          <td mat-cell *matCellDef="let row">{{ row.quantity }} {{ row.unit }}</td>
        </ng-container>
        <ng-container matColumnDef="costPerUnit">
          <th mat-header-cell *matHeaderCellDef>Price/Unit</th>
          <td mat-cell *matCellDef="let row" class="mono">
            {{ row.costPerUnit | currency:'USD':'symbol':'1.2-2' }}
          </td>
        </ng-container>
        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef>Total</th>
          <td mat-cell *matCellDef="let row" class="mono">
            {{ row.total | currency:'USD':'symbol':'1.2-2' }}
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="['name', 'qty', 'costPerUnit', 'total']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['name', 'qty', 'costPerUnit', 'total']"></tr>
      </table>

      <div class="cost-summary">
        <div class="cost-line">
          <span>Total Recipe Cost</span>
          <span class="cost-value">{{ data.totalCost | currency:'USD':'symbol':'1.2-2' }}</span>
        </div>
        <div class="cost-line" *ngIf="data.yieldQuantity > 0">
          <span>Cost per {{ data.yieldUnit }}</span>
          <span class="cost-value accent">{{ data.costPerYield | currency:'USD':'symbol':'1.2-2' }}</span>
        </div>
      </div>

      <p class="cost-note">Prices taken from ingredient inventory data.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button class="close-btn" [mat-dialog-close]="true">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .title-icon { vertical-align: middle; margin-right: 8px; color: #8b4513; }
    .cost-table { width: 100%; margin-bottom: 16px; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .cost-summary {
      background: #faf3e8;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
    }
    .cost-line {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-weight: 500;
      color: #3e2723;
    }
    .cost-value {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 16px;
      color: #8b4513;
    }
    .cost-value.accent { font-size: 18px; }
    .cost-note { font-size: 12px; color: #8d6e63; margin: 0; }
    .close-btn { background-color: #8b4513 !important; color: #fff !important; }
  `],
})
export class EstimateCostDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EstimateCostDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EstimateCostData,
  ) {}
}

@Component({
  selector: 'bake-app-recipe-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDividerModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatTooltipModule,
    BakePageContainerComponent,
  ],
  template: `
    <bake-page-container
      [title]="isNew ? 'New Recipe' : 'Edit Recipe'"
      subtitle="Define ingredients, quantities, and instructions"
    >
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
      </div>
      <div class="editor-layout" *ngIf="!loading">
        <!-- AI Generation Card -->
        <mat-card class="ai-card">
          <mat-card-content>
            <div class="section-header">
              <h3 class="section-title">AI Generate Recipe</h3>
            </div>
            <p class="ai-hint">Generate recipe data from a URL or image using AI</p>
            <div class="ai-actions">
              <div class="ai-url-row">
                <mat-form-field appearance="outline" class="flex-2">
                  <mat-label>Recipe URL</mat-label>
                  <input
                    matInput
                    [(ngModel)]="aiUrl"
                    placeholder="https://example.com/recipe/croissant"
                  />
                </mat-form-field>
                <button
                  mat-stroked-button
                  class="ai-btn"
                  (click)="generateFromUrl()"
                  [disabled]="aiLoading || !aiUrl.trim()"
                >
                  <mat-icon>auto_awesome</mat-icon>
                  Generate from URL
                </button>
              </div>
              <div class="ai-image-row">
                <button mat-stroked-button class="ai-btn" (click)="fileInput.click()" [disabled]="aiLoading">
                  <mat-icon>image</mat-icon>
                  Generate from Image
                </button>
                <input
                  #fileInput
                  type="file"
                  accept="image/*"
                  (change)="onImageSelected($event)"
                  style="display: none"
                />
                <span class="ai-filename" *ngIf="aiImageName">{{ aiImageName }}</span>
              </div>
              <mat-spinner *ngIf="aiLoading" diameter="24"></mat-spinner>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="editor-card">
          <mat-card-content>
            <div class="form-section">
              <h3 class="section-title">Basic Information</h3>
              <div class="form-row">
                <mat-form-field appearance="outline" class="flex-2">
                  <mat-label>Recipe Name</mat-label>
                  <input matInput [(ngModel)]="recipeName" placeholder="Recipe name" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Category</mat-label>
                  <mat-select [(ngModel)]="recipeCategory">
                    <mat-option *ngFor="let cat of categories" [value]="cat">
                      {{ cat }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="form-row">
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Yield Quantity</mat-label>
                  <input
                    matInput
                    type="number"
                    [(ngModel)]="yieldQuantity"
                    placeholder="10"
                    min="0"
                  />
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Yield Unit</mat-label>
                  <mat-select [(ngModel)]="yieldUnit">
                    <mat-option value="pcs">Pieces</mat-option>
                    <mat-option value="loaves">Loaves</mat-option>
                    <mat-option value="cakes">Cakes</mat-option>
                    <mat-option value="kg">Kilograms</mat-option>
                    <mat-option value="liters">Liters</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>

            <mat-divider class="section-divider"></mat-divider>

            <div class="form-section">
              <div class="section-header">
                <h3 class="section-title">Ingredients</h3>
                <div class="section-header-actions">
                  <span [matTooltip]="estimateDisabledReason" [matTooltipDisabled]="!estimateDisabledReason">
                    <button
                      mat-stroked-button
                      class="estimate-btn"
                      (click)="openEstimateCost()"
                      [disabled]="!!estimateDisabledReason"
                    >
                      <mat-icon>calculate</mat-icon>
                      Estimate Cost
                    </button>
                  </span>
                  <button mat-stroked-button class="add-btn" (click)="addIngredient()">
                    <mat-icon>add</mat-icon>
                    Add Ingredient
                  </button>
                </div>
              </div>

              <div class="ingredients-table-wrapper">
                <table mat-table [dataSource]="ingredients" class="ingredients-table">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Ingredient</th>
                    <td mat-cell *matCellDef="let row; let i = index">
                      <mat-form-field
                        appearance="outline"
                        class="table-field"
                        [class.ingredient-error]="row.hasError"
                      >
                        <input
                          matInput
                          [(ngModel)]="row.name"
                          [matAutocomplete]="autoIng"
                          (ngModelChange)="filterIngredients(row); row.hasError = false"
                          (focus)="filterIngredients(row)"
                          placeholder="Type to search..."
                        />
                        <button
                          *ngIf="row.name"
                          matSuffix
                          mat-icon-button
                          type="button"
                          class="clear-ingredient-btn"
                          (click)="clearIngredient(row); $event.stopPropagation()"
                        >
                          <mat-icon>close</mat-icon>
                        </button>
                        <mat-autocomplete
                          #autoIng="matAutocomplete"
                          (optionSelected)="onIngredientPicked($event, row)"
                          [displayWith]="displayIngredient"
                        >
                          <mat-option
                            *ngFor="let ing of row.filteredOptions"
                            [value]="ing"
                          >
                            {{ ing.name }} ({{ ing.unit }})
                          </mat-option>
                          <mat-option
                            *ngIf="!row.ingredientId"
                            class="create-new-option"
                            [value]="{ __createNew: true, name: row.name }"
                          >
                            <mat-icon>add_circle</mat-icon>
                            Create "{{ row.name || 'New Ingredient' }}"
                          </mat-option>
                        </mat-autocomplete>
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="quantity">
                    <th mat-header-cell *matHeaderCellDef>Quantity</th>
                    <td mat-cell *matCellDef="let row">
                      <mat-form-field appearance="outline" class="table-field narrow">
                        <input
                          matInput
                          type="number"
                          [(ngModel)]="row.quantity"
                          placeholder="0"
                          min="0"
                        />
                      </mat-form-field>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="unit">
                    <th mat-header-cell *matHeaderCellDef>Unit</th>
                    <td mat-cell *matCellDef="let row">
                      <span class="unit-label">{{ row.unit || '-' }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="remove">
                    <th mat-header-cell *matHeaderCellDef></th>
                    <td mat-cell *matCellDef="let row; let i = index">
                      <button
                        mat-icon-button
                        color="warn"
                        (click)="confirmRemoveIngredient(i, row)"
                        [disabled]="ingredients.length <= 1"
                      >
                        <mat-icon>close</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="ingredientColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: ingredientColumns"></tr>
                </table>
              </div>
            </div>

            <mat-divider class="section-divider"></mat-divider>

            <div class="form-section">
              <div class="section-header">
                <h3 class="section-title">Links</h3>
                <button mat-stroked-button class="add-btn" (click)="addLink()">
                  <mat-icon>add</mat-icon>
                  Add Link
                </button>
              </div>

              <div class="links-list">
                <div *ngFor="let link of links; let i = index" class="link-item">
                  <div class="link-row">
                    <div class="link-fields" *ngIf="link.editing">
                      <mat-form-field appearance="outline" class="flex-2">
                        <mat-label>URL</mat-label>
                        <input
                          matInput
                          [(ngModel)]="link.url"
                          (ngModelChange)="onLinkUrlChange(link)"
                          placeholder="https://..."
                        />
                      </mat-form-field>
                      <mat-form-field appearance="outline" class="flex-2">
                        <mat-label>Title</mat-label>
                        <input matInput [(ngModel)]="link.title" placeholder="Link title" />
                      </mat-form-field>
                      <button mat-icon-button color="primary" (click)="link.editing = false">
                        <mat-icon>check</mat-icon>
                      </button>
                    </div>
                    <div class="link-display" *ngIf="!link.editing">
                      <mat-icon class="link-type-icon">
                        {{ link.isYoutube ? 'play_circle' : 'link' }}
                      </mat-icon>
                      <div class="link-info">
                        <span class="link-title">{{ link.title || link.url }}</span>
                        <a class="link-url" [href]="link.url" target="_blank">{{ link.url }}</a>
                      </div>
                      <button mat-icon-button (click)="link.editing = true">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="removeLink(i)">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>
                  </div>

                  <mat-accordion *ngIf="link.isYoutube && link.youtubeVideoId && !link.editing">
                    <mat-expansion-panel>
                      <mat-expansion-panel-header>
                        <mat-panel-title>
                          <mat-icon>play_circle</mat-icon>
                          Watch Video
                        </mat-panel-title>
                      </mat-expansion-panel-header>
                      <div class="youtube-embed">
                        <iframe
                          [src]="getYoutubeEmbedUrl(link.youtubeVideoId)"
                          frameborder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowfullscreen
                        ></iframe>
                      </div>
                    </mat-expansion-panel>
                  </mat-accordion>
                </div>

                <div *ngIf="links.length === 0" class="no-links">
                  No links added yet
                </div>
              </div>
            </div>

            <mat-divider class="section-divider"></mat-divider>

            <div class="form-section">
              <h3 class="section-title">Instructions</h3>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Preparation Instructions</mat-label>
                <textarea
                  matInput
                  [(ngModel)]="instructions"
                  rows="8"
                  placeholder="Step-by-step preparation instructions..."
                ></textarea>
              </mat-form-field>
            </div>

            <div class="editor-actions">
              <button mat-button (click)="onCancel()">Cancel</button>
              <button mat-flat-button class="save-btn" [disabled]="saving" (click)="onSave()">
                <mat-icon>save</mat-icon>
                Save Recipe
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </bake-page-container>
  `,
  styles: [
    `
      .loading-container {
        display: flex;
        justify-content: center;
        padding: 64px 0;
      }
      .editor-layout {
        max-width: 900px;
      }

      .ai-card {
        border-radius: 12px;
        padding: 8px;
        margin-bottom: 24px;
        border: 1px dashed #8b4513;
        background: #fdf8f0;
      }

      .ai-hint {
        color: #5d4037;
        font-size: 13px;
        margin: 0 0 16px;
      }

      .ai-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ai-url-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }

      .ai-image-row {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .ai-btn {
        color: #8b4513;
        border-color: #8b4513;
        white-space: nowrap;
        height: 56px;
      }

      .ai-filename {
        font-size: 13px;
        color: #5d4037;
      }

      .editor-card {
        border-radius: 12px;
        padding: 8px;
      }

      .form-section {
        margin-bottom: 8px;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #3e2723;
        margin: 0 0 16px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .section-header .section-title {
        margin: 0;
      }

      .section-divider {
        margin: 24px 0;
      }

      .form-row {
        display: flex;
        gap: 16px;
      }

      .flex-1 {
        flex: 1;
      }

      .flex-2 {
        flex: 2;
      }

      .full-width {
        width: 100%;
      }

      .add-btn {
        color: #8b4513;
        border-color: #8b4513;
      }

      .section-header-actions {
        display: flex;
        gap: 8px;
      }

      .estimate-btn {
        color: #8b4513;
        border-color: #8b4513;
      }

      .unit-label {
        font-size: 13px;
        color: #5d4037;
        font-weight: 500;
      }

      .ingredients-table-wrapper {
        overflow-x: auto;
        border: 1px solid #e0d6c8;
        border-radius: 8px;
        margin-bottom: 16px;
      }

      .ingredients-table {
        width: 100%;
      }

      .table-field {
        width: 100%;
        margin: 4px 0;
      }

      .table-field.narrow {
        max-width: 120px;
      }

      ::ng-deep .table-field .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }

      /* Links section */
      .links-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .link-item {
        border: 1px solid #e0d6c8;
        border-radius: 8px;
        overflow: hidden;
      }

      .link-row {
        padding: 12px 16px;
      }

      .link-fields {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }

      .link-display {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .link-type-icon {
        color: #8b4513;
        flex-shrink: 0;
      }

      .link-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .link-title {
        font-weight: 500;
        color: #3e2723;
      }

      .link-url {
        font-size: 12px;
        color: #8b4513;
        text-decoration: none;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .link-url:hover {
        text-decoration: underline;
      }

      .no-links {
        text-align: center;
        color: #9e9e9e;
        padding: 24px;
        font-style: italic;
      }

      .youtube-embed {
        position: relative;
        padding-bottom: 56.25%;
        height: 0;
        overflow: hidden;
      }

      .youtube-embed iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 8px;
      }

      ::ng-deep .link-item .mat-expansion-panel {
        box-shadow: none !important;
        border-top: 1px solid #e0d6c8;
      }

      ::ng-deep .link-item .mat-expansion-panel-header {
        padding: 0 16px;
      }

      ::ng-deep .link-item .mat-expansion-panel-body {
        padding: 0 16px 16px;
      }

      ::ng-deep .link-item .mat-panel-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #8b4513;
        font-size: 14px;
      }

      .editor-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
      }

      .save-btn {
        background-color: #8b4513 !important;
        color: #ffffff !important;
      }

      ::ng-deep .table-field .mat-mdc-form-field-icon-suffix {
        display: flex;
        align-items: center;
        padding: 0 4px 0 0;
      }

      .clear-ingredient-btn {
        width: 24px;
        height: 24px;
        padding: 0;
      }

      .clear-ingredient-btn mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #9e9e9e;
      }

      ::ng-deep .ingredients-table .mat-column-remove {
        width: 40px;
        padding-right: 4px !important;
      }

      ::ng-deep .ingredient-error .mdc-notched-outline__leading,
      ::ng-deep .ingredient-error .mdc-notched-outline__notch,
      ::ng-deep .ingredient-error .mdc-notched-outline__trailing {
        border-color: #c62828 !important;
      }

      ::ng-deep .ingredient-error .mdc-text-field--outlined:not(.mdc-text-field--disabled)
        .mdc-floating-label {
        color: #c62828 !important;
      }

      ::ng-deep .create-new-option {
        border-top: 1px solid #e0d6c8;
        color: #8b4513 !important;
        font-weight: 500;
      }

      ::ng-deep .create-new-option mat-icon {
        vertical-align: middle;
        margin-right: 8px;
        font-size: 20px;
        height: 20px;
        width: 20px;
      }
    `,
  ],
})
export class RecipeEditorComponent implements OnInit {
  recipeId = '';
  isNew = true;
  loading = false;
  saving = false;
  recipeName = '';
  recipeCategory = '';
  yieldQuantity = 0;
  yieldUnit = 'pcs';
  instructions = '';

  categories: string[] = [];
  availableIngredients: Ingredient[] = [];

  ingredientColumns = ['name', 'quantity', 'unit', 'remove'];

  ingredients: IngredientRow[] = [
    { name: '', quantity: 0, unit: '-', cost: 0, total: 0, filteredOptions: [] },
  ];

  links: LinkRow[] = [];

  // AI generation
  aiUrl = '';
  aiImageName = '';
  aiLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private confirmService: BakeConfirmationService,
    private toastService: BakeToastService,
    private apiClient: ApiClientService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.recipeId = this.route.snapshot.paramMap.get('id') || 'new';
    this.isNew = this.recipeId === 'new';
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    const requests: Record<string, any> = {
      categories: this.apiClient.get<SharedCategory[]>('/v1/categories?type=menu'),
      ingredients: this.apiClient.get<PaginatedResponse<Ingredient>>('/v1/ingredients?limit=200'),
    };
    if (!this.isNew) {
      requests['recipe'] = this.apiClient.get<Recipe>(`/v1/recipes/${this.recipeId}`);
    }
    forkJoin(requests).subscribe({
      next: (results: any) => {
        this.categories = (results.categories || []).map((c: SharedCategory) => c.name);
        this.availableIngredients = results.ingredients?.data || [];
        if (results.recipe) {
          this.applyRecipeData(results.recipe);
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Failed to load recipe data');
        this.router.navigate(['/recipes']);
      },
    });
  }

  clearIngredient(row: IngredientRow): void {
    row.name = '';
    row.ingredientId = undefined;
    row.unit = '';
    row.hasError = false;
    this.ingredients = [...this.ingredients];
  }

  filterIngredients(row: IngredientRow): void {
    const query = (row.name || '').toLowerCase();
    // If user edits a linked ingredient's name, unlink it
    if (row.ingredientId) {
      const linked = this.availableIngredients.find((a) => a.id === row.ingredientId);
      if (linked && linked.name !== row.name) {
        row.ingredientId = undefined;
        row.unit = '';
      }
    }
    row.filteredOptions = query
      ? this.availableIngredients.filter((i) => i.name.toLowerCase().includes(query))
      : this.availableIngredients;
  }

  onIngredientPicked(event: any, row: IngredientRow): void {
    const value = event.option.value;
    if (value?.__createNew) {
      // Reset the row name to what was typed before opening the dialog
      const typedName = value.name || '';
      row.name = typedName;
      this.openCreateIngredientDialog(row, typedName);
      return;
    }
    const ing: Ingredient = value;
    row.ingredientId = ing.id;
    row.name = ing.name;
    row.unit = ing.unit;
    row.hasError = false;
    this.ingredients = [...this.ingredients];
  }

  private openCreateIngredientDialog(row: IngredientRow, prefillName: string): void {
    const dialogRef = this.dialog.open(CreateIngredientDialogComponent, {
      width: '480px',
    });

    // Pre-fill the name after the dialog opens
    dialogRef.afterOpened().subscribe(() => {
      const formComp = dialogRef.componentInstance.form;
      if (formComp) {
        formComp.formData.name = prefillName;
      }
    });

    dialogRef.afterClosed().subscribe((created: Ingredient | null) => {
      if (created) {
        this.availableIngredients = [...this.availableIngredients, created];
        row.ingredientId = created.id;
        row.name = created.name;
        row.unit = created.unit;
        row.hasError = false;
        this.ingredients = [...this.ingredients];
      }
    });
  }

  displayIngredient = (value: any): string => {
    if (typeof value === 'string') return value;
    if (value?.__createNew) return value.name || '';
    return value?.name || '';
  };

  private applyRecipeData(recipe: Partial<Recipe>): void {
    if (recipe.name) this.recipeName = recipe.name;
    if (recipe.category !== undefined) this.recipeCategory = recipe.category || '';
    if (recipe.yieldQuantity !== undefined) this.yieldQuantity = recipe.yieldQuantity;
    if (recipe.yieldUnit) this.yieldUnit = recipe.yieldUnit;
    if (recipe.instructions !== undefined) this.instructions = recipe.instructions || '';
    if (recipe.ingredients?.length) {
      this.ingredients = recipe.ingredients.map((ing) => ({
        ingredientId: ing.ingredientId,
        name: ing.ingredientName || '',
        quantity: ing.quantity,
        unit: ing.unit,
        cost: Number(ing.costPerUnit),
        total: Math.round(ing.quantity * Number(ing.costPerUnit)),
        filteredOptions: [],
      }));
    }
    if (this.ingredients.length === 0 || (this.ingredients.length === 1 && !this.ingredients[0].name)) {
      this.ingredients = [{ name: '', quantity: 0, unit: 'g', cost: 0, total: 0, filteredOptions: [] }];
    }
    if (recipe.links?.length) {
      this.links = recipe.links.map((l) => ({
        url: l.url,
        title: l.title || '',
        isYoutube: l.isYoutube,
        youtubeVideoId: l.youtubeVideoId || '',
        editing: false,
      }));
    }
  }

  get estimateDisabledReason(): string {
    const linked = this.ingredients.filter((i) => !!i.ingredientId);
    if (linked.length === 0) {
      return 'Select at least one ingredient from the dropdown';
    }
    if (linked.some((i) => !i.quantity || i.quantity <= 0)) {
      return 'All ingredients must have a quantity greater than 0';
    }
    return '';
  }

  openEstimateCost(): void {
    const linked = this.ingredients.filter((i) => i.ingredientId);
    const costRows = linked.map((row) => {
      const ing = this.availableIngredients.find((a) => a.id === row.ingredientId);
      const costPerUnit = ing ? Number(ing.costPerUnit) : 0;
      const total = Math.round(row.quantity * costPerUnit * 100) / 100;
      return {
        name: row.name,
        quantity: row.quantity,
        unit: row.unit,
        costPerUnit,
        total,
      };
    });
    const totalCost = costRows.reduce((sum, r) => sum + r.total, 0);
    const costPerYield = this.yieldQuantity > 0
      ? Math.round((totalCost / this.yieldQuantity) * 100) / 100
      : 0;

    this.dialog.open(EstimateCostDialogComponent, {
      width: '560px',
      data: { rows: costRows, totalCost, costPerYield, yieldQuantity: this.yieldQuantity, yieldUnit: this.yieldUnit },
    });
  }

  addIngredient(): void {
    this.ingredients = [
      ...this.ingredients,
      { name: '', quantity: 0, unit: 'g', cost: 0, total: 0, filteredOptions: [] },
    ];
  }

  confirmRemoveIngredient(index: number, row: IngredientRow): void {
    const name = row.name || `Ingredient #${index + 1}`;
    this.confirmService
      .confirm({
        title: 'Remove Ingredient',
        message: `Are you sure you want to remove "${name}" from this recipe?`,
        confirmText: 'Remove',
        confirmColor: 'warn',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.ingredients = this.ingredients.filter((_, i) => i !== index);
        }
      });
  }

  // Links management
  addLink(): void {
    this.links = [
      ...this.links,
      { url: '', title: '', isYoutube: false, youtubeVideoId: '', editing: true },
    ];
  }

  removeLink(index: number): void {
    this.links = this.links.filter((_, i) => i !== index);
  }

  onLinkUrlChange(link: LinkRow): void {
    const match = link.url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    link.isYoutube = !!match;
    link.youtubeVideoId = match ? match[1] : '';
  }

  getYoutubeEmbedUrl(videoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${videoId}`,
    );
  }

  // AI generation
  generateFromUrl(): void {
    if (!this.aiUrl.trim()) return;
    this.aiLoading = true;
    this.apiClient.post<Partial<Recipe>>('/v1/recipes/generate/from-url', { url: this.aiUrl }).subscribe({
      next: (data) => {
        this.applyRecipeData(data as Partial<Recipe>);
        this.toastService.success('Recipe generated from URL');
        this.aiLoading = false;
      },
      error: (err: any) => {
        this.toastService.error(err?.error?.message || 'Failed to generate recipe from URL');
        this.aiLoading = false;
      },
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.aiImageName = file.name;
    this.aiLoading = true;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      const mimeType = file.type || 'image/jpeg';

      this.apiClient
        .post<Partial<Recipe>>('/v1/recipes/generate/from-image', {
          imageBase64: base64,
          mimeType,
        })
        .subscribe({
          next: (data) => {
            this.applyRecipeData(data as Partial<Recipe>);
            this.toastService.success('Recipe generated from image');
            this.aiLoading = false;
          },
          error: (err: any) => {
            this.toastService.error(err?.error?.message || 'Failed to generate recipe from image');
            this.aiLoading = false;
          },
        });
    };
    reader.readAsDataURL(file);
  }

  onSave(): void {
    if (!this.recipeName.trim()) {
      this.toastService.warning('Please enter a recipe name');
      return;
    }

    // Check for ingredients that have a name typed but are not linked to an existing ingredient
    const unlinked = this.ingredients.filter(
      (ing) => ing.name.trim() && !ing.ingredientId,
    );
    if (unlinked.length > 0) {
      unlinked.forEach((ing) => (ing.hasError = true));
      this.ingredients = [...this.ingredients];
      const names = unlinked.map((ing) => `"${ing.name}"`).join(', ');
      this.confirmService
        .confirm({
          title: 'Unlinked Ingredients',
          message: `The following ingredients haven't been selected from the list or created yet: ${names}. Please select an existing ingredient or use "Create New" for each one.`,
          confirmText: 'OK',
          confirmColor: 'primary',
          hideCancel: true,
        })
        .subscribe();
      return;
    }

    const dto = {
      name: this.recipeName,
      category: this.recipeCategory,
      yieldQuantity: this.yieldQuantity,
      yieldUnit: this.yieldUnit,
      instructions: this.instructions,
      ingredients: this.ingredients
        .filter((ing) => ing.name.trim() && ing.ingredientId)
        .map((ing) => {
          const linked = this.availableIngredients.find((a) => a.id === ing.ingredientId);
          return {
            ingredientId: ing.ingredientId,
            ingredientName: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            costPerUnit: linked ? Number(linked.costPerUnit) : 0,
          };
        }),
      links: this.links
        .filter((l) => l.url.trim())
        .map((l) => ({
          url: l.url,
          title: l.title,
          isYoutube: l.isYoutube,
          youtubeVideoId: l.youtubeVideoId,
        })),
    };

    const request$ = this.isNew
      ? this.apiClient.post<Recipe>('/v1/recipes', dto)
      : this.apiClient.put<Recipe>(`/v1/recipes/${this.recipeId}`, dto);

    this.saving = true;
    request$.subscribe({
      next: () => {
        this.saving = false;
        this.toastService.success('Recipe saved successfully');
        this.router.navigate(['/recipes']);
      },
      error: () => {
        this.saving = false;
        this.toastService.error('Failed to save recipe');
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/recipes']);
  }
}

export default RecipeEditorComponent;
