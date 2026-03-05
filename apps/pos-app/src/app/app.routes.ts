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
    path: 'pos',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/pos/pos.component').then((m) => m.PosComponent),
  },
  {
    path: 'orders',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/orders/orders.component').then((m) => m.OrdersComponent),
  },
  {
    path: 'orders/:id',
    canActivate: [AuthGuard],
    loadComponent: () =>
      import('./pages/order-detail/order-detail.component').then(
        (m) => m.OrderDetailComponent
      ),
  },
];
