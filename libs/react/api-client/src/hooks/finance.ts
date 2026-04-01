import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { FinanceTransaction } from '@bake-app/shared-types';
import type { PaginatedResponse } from '../types';

export const financeKeys = {
  all: ['finance'] as const,
  transactions: (params?: Record<string, unknown>) =>
    [...financeKeys.all, 'transactions', params] as const,
  summary: (params: Record<string, unknown>) =>
    [...financeKeys.all, 'summary', params] as const,
  expenses: (params?: Record<string, unknown>) =>
    [...financeKeys.all, 'expenses', params] as const,
};

export function useFinanceTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
  locationId?: string;
}) {
  return useQuery({
    queryKey: financeKeys.transactions(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<FinanceTransaction>>(
        '/v1/finance/transactions',
        params,
      ),
  });
}

export function useFinanceSummary(params: {
  startDate: string;
  endDate: string;
  locationId?: string;
}) {
  return useQuery({
    queryKey: financeKeys.summary(params),
    queryFn: () => apiClient.get('/v1/finance/summary', params),
  });
}

export function useExpenses(params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  locationId?: string;
}) {
  return useQuery({
    queryKey: financeKeys.expenses(params),
    queryFn: () => apiClient.get('/v1/finance/expenses', params),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      amount: number;
      category: string;
      description?: string;
      locationId?: string;
    }) => apiClient.post('/v1/finance/expenses', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
}
