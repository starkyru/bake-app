import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthGuard, AuthService } from '@bake-app/auth';

const loginGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell.component').then((m) => m.ShellComponent),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users.component').then(
            (m) => m.UsersComponent
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/products/products.component').then(
            (m) => m.ProductsComponent
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories/categories.component').then(
            (m) => m.CategoriesComponent
          ),
      },
      {
        path: 'ingredients',
        loadComponent: () =>
          import('./pages/ingredients/ingredients.component').then(
            (m) => m.IngredientsComponent
          ),
      },
      {
        path: 'recipes',
        loadComponent: () =>
          import('./pages/recipes/recipes.component').then(
            (m) => m.RecipesComponent
          ),
      },
      {
        path: 'recipes/:id',
        loadComponent: () =>
          import('./pages/recipe-editor/recipe-editor.component').then(
            (m) => m.RecipeEditorComponent
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./pages/inventory/inventory.component').then(
            (m) => m.InventoryComponent
          ),
      },
      {
        path: 'finance',
        loadComponent: () =>
          import('./pages/finance/finance.component').then(
            (m) => m.FinanceComponent
          ),
      },
      {
        path: 'sales',
        loadComponent: () =>
          import('./pages/sales/sales.component').then(
            (m) => m.SalesComponent
          ),
      },
      {
        path: 'production',
        loadComponent: () =>
          import('./pages/production/production.component').then(
            (m) => m.ProductionComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
    ],
  },
];
