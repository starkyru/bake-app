import { Routes, Route, Navigate } from 'react-router';
import { ProtectedRoute } from '@bake-app/react/auth';
import { LoginPage } from './pages/login';
import { QueuePage } from './pages/queue';
import { OrderDetailPage } from './pages/order-detail';
import { ProductionPage } from './pages/production';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/production" element={<ProductionPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
