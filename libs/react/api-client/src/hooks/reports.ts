import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export const reportKeys = {
  all: ['reports'] as const,
  salesToday: () => [...reportKeys.all, 'sales-today'] as const,
  salesSummary: (params?: Record<string, unknown>) =>
    [...reportKeys.all, 'sales-summary', params] as const,
  topProducts: (params?: Record<string, unknown>) =>
    [...reportKeys.all, 'top-products', params] as const,
  salesByCategory: (params?: Record<string, unknown>) =>
    [...reportKeys.all, 'sales-by-category', params] as const,
  paymentMethods: (params?: Record<string, unknown>) =>
    [...reportKeys.all, 'payment-methods', params] as const,
  finance: (params?: Record<string, unknown>) =>
    [...reportKeys.all, 'finance', params] as const,
  inventory: () => [...reportKeys.all, 'inventory'] as const,
  inventoryMovements: (params?: Record<string, unknown>) =>
    [...reportKeys.all, 'inventory-movements', params] as const,
  production: (params?: Record<string, unknown>) =>
    [...reportKeys.all, 'production', params] as const,
};

export function useSalesToday() {
  return useQuery({
    queryKey: reportKeys.salesToday(),
    queryFn: () => apiClient.get('/v1/reports/sales/today'),
  });
}

export function useSalesSummary(params?: {
  startDate?: string;
  endDate?: string;
  locationId?: string;
}) {
  return useQuery({
    queryKey: reportKeys.salesSummary(params),
    queryFn: () => apiClient.get('/v1/reports/sales/summary', params),
  });
}

export function useTopProducts(params?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
  locationId?: string;
}) {
  return useQuery({
    queryKey: reportKeys.topProducts(params),
    queryFn: () => apiClient.get('/v1/reports/sales/top-products', params),
  });
}

export function useSalesByCategory(params?: {
  startDate?: string;
  endDate?: string;
  locationId?: string;
}) {
  return useQuery({
    queryKey: reportKeys.salesByCategory(params),
    queryFn: () =>
      apiClient.get('/v1/reports/sales/by-category', params),
  });
}

export function usePaymentMethods(params?: {
  startDate?: string;
  endDate?: string;
  locationId?: string;
}) {
  return useQuery({
    queryKey: reportKeys.paymentMethods(params),
    queryFn: () =>
      apiClient.get('/v1/reports/sales/payment-methods', params),
  });
}

export function useFinanceReport(params?: {
  startDate?: string;
  endDate?: string;
  locationId?: string;
}) {
  return useQuery({
    queryKey: reportKeys.finance(params),
    queryFn: () => apiClient.get('/v1/reports/finance/summary', params),
  });
}

export function useInventoryReport() {
  return useQuery({
    queryKey: reportKeys.inventory(),
    queryFn: () => apiClient.get('/v1/reports/inventory/status'),
  });
}

export function useInventoryMovementsReport(params?: {
  startDate?: string;
  endDate?: string;
  ingredientId?: string;
  locationId?: string;
}) {
  return useQuery({
    queryKey: reportKeys.inventoryMovements(params),
    queryFn: () =>
      apiClient.get('/v1/reports/inventory/movements', params),
  });
}

export function useProductionReport(params?: {
  startDate?: string;
  endDate?: string;
  locationId?: string;
}) {
  return useQuery({
    queryKey: reportKeys.production(params),
    queryFn: () =>
      apiClient.get('/v1/reports/production/summary', params),
  });
}
