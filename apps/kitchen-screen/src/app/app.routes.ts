import { Routes } from '@angular/router';
import { AuthGuard } from '@bake-app/auth';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'queue',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/queue/queue.component').then(m => m.QueueComponent),
  },
  {
    path: 'orders/:id',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/order-detail/order-detail.component').then(
        m => m.OrderDetailComponent
      ),
  },
  {
    path: 'production',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/production/production.component').then(
        m => m.ProductionComponent
      ),
  },
];
