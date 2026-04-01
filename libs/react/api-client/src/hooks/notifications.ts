import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { Notification } from '@bake-app/shared-types';
import type { PaginatedResponse } from '../types';

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params?: Record<string, unknown>) =>
    [...notificationKeys.lists(), params] as const,
};

export function useNotifications(params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
}) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<Notification>>(
        '/v1/notifications',
        params,
      ),
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.put(`/v1/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.put('/v1/notifications/read-all'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
