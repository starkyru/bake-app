import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { Permission } from '@bake-app/shared-types';

export const permissionKeys = {
  all: ['permissions'] as const,
  list: () => [...permissionKeys.all, 'list'] as const,
  role: (roleId: string) =>
    [...permissionKeys.all, 'role', roleId] as const,
  user: (userId: string) =>
    [...permissionKeys.all, 'user', userId] as const,
};

export function usePermissions() {
  return useQuery({
    queryKey: permissionKeys.list(),
    queryFn: () => apiClient.get<Permission[]>('/v1/permissions'),
  });
}

export function useRolePermissions(roleId: string) {
  return useQuery({
    queryKey: permissionKeys.role(roleId),
    queryFn: () =>
      apiClient.get<Permission[]>(`/v1/permissions/roles/${roleId}`),
    enabled: !!roleId,
  });
}

export function useUpdateRolePermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      permissionIds,
    }: {
      roleId: string;
      permissionIds: string[];
    }) =>
      apiClient.put(`/v1/permissions/roles/${roleId}`, { permissionIds }),
    onSuccess: (_data, { roleId }) => {
      qc.invalidateQueries({ queryKey: permissionKeys.role(roleId) });
    },
  });
}

export function useUserPermissions(userId: string) {
  return useQuery({
    queryKey: permissionKeys.user(userId),
    queryFn: () =>
      apiClient.get<Permission[]>(`/v1/permissions/users/${userId}`),
    enabled: !!userId,
  });
}
