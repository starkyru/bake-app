import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'pos',
    loadComponent: () =>
      import('./pages/pos/pos.component').then((m) => m.PosComponent),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./pages/orders/orders.component').then((m) => m.OrdersComponent),
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./pages/order-detail/order-detail.component').then(
        (m) => m.OrderDetailComponent
      ),
  },
];
