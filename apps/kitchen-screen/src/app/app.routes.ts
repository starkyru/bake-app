import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'queue', pathMatch: 'full' },
  {
    path: 'queue',
    loadComponent: () =>
      import('./pages/queue/queue.component').then(m => m.QueueComponent),
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./pages/order-detail/order-detail.component').then(
        m => m.OrderDetailComponent
      ),
  },
  {
    path: 'production',
    loadComponent: () =>
      import('./pages/production/production.component').then(
        m => m.ProductionComponent
      ),
  },
];
