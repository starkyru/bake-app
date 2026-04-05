import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { CustomerProtectedRoute } from '@bake-app/react/customer-auth';
import { OrderingShell } from './layouts/ordering-shell';
import { CheckoutLayout } from './layouts/checkout-layout';
import { AccountLayout } from './layouts/account-layout';
import { LandingPage } from './pages/landing';
import { MenuBrowserPage } from './pages/menu-browser';
import { ProductDetailPage } from './pages/product-detail';
import { CartPage } from './pages/cart';
import { CheckoutPage } from './pages/checkout';
import { OrderConfirmationPage } from './pages/order-confirmation';
import { OrderTrackingPage } from './pages/order-tracking';
import { LoginPage } from './pages/login';
import { RegisterPage } from './pages/register';
import { CustomCakeRequestPage } from './pages/custom-cake-request';
import { ProfilePage } from './pages/account/profile';
import { AddressesPage } from './pages/account/addresses';
import { OrderHistoryPage } from './pages/account/order-history';
import { FavoritesPage } from './pages/account/favorites';
import { NotificationsPage } from './pages/account/notifications';

const router = createBrowserRouter([
  {
    element: <OrderingShell />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'menu', element: <MenuBrowserPage /> },
      { path: 'menu/:productId', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'custom-cake', element: <CustomCakeRequestPage /> },
      { path: 'orders/:orderId/track', element: <OrderTrackingPage /> },
      {
        element: <CustomerProtectedRoute />,
        children: [
          {
            path: 'account',
            element: <AccountLayout />,
            children: [
              { index: true, element: <ProfilePage /> },
              { path: 'addresses', element: <AddressesPage /> },
              { path: 'orders', element: <OrderHistoryPage /> },
              { path: 'favorites', element: <FavoritesPage /> },
              { path: 'notifications', element: <NotificationsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <CheckoutLayout />,
    children: [
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order-confirmation/:orderId', element: <OrderConfirmationPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
