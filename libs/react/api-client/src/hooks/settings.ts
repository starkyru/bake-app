import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export const settingsKeys = {
  all: ['settings'] as const,
  group: (group: string) => [...settingsKeys.all, group] as const,
};

export function useSettings(group: string) {
  return useQuery({
    queryKey: settingsKeys.group(group),
    queryFn: () => apiClient.get<Record<string, unknown>>(`/v1/settings/${group}`),
    enabled: !!group,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      group,
      ...data
    }: {
      group: string;
      [key: string]: unknown;
    }) => apiClient.put(`/v1/settings/${group}`, data),
    onSuccess: (_data, { group }) => {
      qc.invalidateQueries({ queryKey: settingsKeys.group(group) });
    },
  });
}
