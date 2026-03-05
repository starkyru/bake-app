import { Routes } from '@angular/router';
import { AuthGuard } from '@bake-app/auth';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
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
    ],
  },
];
