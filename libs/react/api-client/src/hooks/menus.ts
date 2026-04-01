import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { Menu, MenuProduct } from '@bake-app/shared-types';

export const menuKeys = {
  all: ['menus'] as const,
  lists: () => [...menuKeys.all, 'list'] as const,
  list: () => [...menuKeys.lists()] as const,
  details: () => [...menuKeys.all, 'detail'] as const,
  detail: (id: string) => [...menuKeys.details(), id] as const,
};

export function useMenus() {
  return useQuery({
    queryKey: menuKeys.list(),
    queryFn: () => apiClient.get<Menu[]>('/v1/menus'),
  });
}

export function useMenu(id: string) {
  return useQuery({
    queryKey: menuKeys.detail(id),
    queryFn: () => apiClient.get<Menu>(`/v1/menus/${id}`),
    enabled: !!id,
  });
}

export function useCreateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Menu>) =>
      apiClient.post<Menu>('/v1/menus', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menuKeys.lists() });
    },
  });
}

export function useUpdateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Menu> & { id: string }) =>
      apiClient.put<Menu>(`/v1/menus/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: menuKeys.lists() });
      qc.invalidateQueries({ queryKey: menuKeys.detail(id) });
    },
  });
}

export function useDeleteMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.del(`/v1/menus/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: menuKeys.lists() });
    },
  });
}

export function useAddMenuProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      menuId,
      ...data
    }: Partial<MenuProduct> & { menuId: string }) =>
      apiClient.post<MenuProduct>(`/v1/menus/${menuId}/products`, data),
    onSuccess: (_data, { menuId }) => {
      qc.invalidateQueries({ queryKey: menuKeys.detail(menuId) });
      qc.invalidateQueries({ queryKey: menuKeys.lists() });
    },
  });
}

export function useRemoveMenuProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      menuId,
      productId,
    }: {
      menuId: string;
      productId: string;
    }) => apiClient.del(`/v1/menus/${menuId}/products/${productId}`),
    onSuccess: (_data, { menuId }) => {
      qc.invalidateQueries({ queryKey: menuKeys.detail(menuId) });
      qc.invalidateQueries({ queryKey: menuKeys.lists() });
    },
  });
}
