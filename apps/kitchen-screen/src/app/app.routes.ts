import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'orders',
    pathMatch: 'full',
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./pages/orders/orders.component').then(m => m.OrdersComponent),
  },
];
