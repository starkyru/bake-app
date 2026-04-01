import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type {
  InventoryItem,
  InventoryItemPackage,
  InventoryShipment,
} from '@bake-app/shared-types';

export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: () => [...inventoryKeys.lists()] as const,
  details: () => [...inventoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...inventoryKeys.details(), id] as const,
  shipments: (id: string) =>
    [...inventoryKeys.all, 'shipments', id] as const,
};

export function useInventoryItems() {
  return useQuery({
    queryKey: inventoryKeys.list(),
    queryFn: () => apiClient.get<InventoryItem[]>('/v1/inventory'),
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: inventoryKeys.detail(id),
    queryFn: () => apiClient.get<InventoryItem>(`/v1/inventory/${id}`),
    enabled: !!id,
  });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InventoryItem>) =>
      apiClient.post<InventoryItem>('/v1/inventory', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useUpdateInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<InventoryItem> & { id: string }) =>
      apiClient.put<InventoryItem>(`/v1/inventory/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.lists() });
      qc.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
    },
  });
}

export function useDeleteInventoryItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.del(`/v1/inventory/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useAddPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      inventoryItemId,
      ...data
    }: Partial<InventoryItemPackage> & { inventoryItemId: string }) =>
      apiClient.post<InventoryItemPackage>(
        `/v1/inventory/${inventoryItemId}/packages`,
        data,
      ),
    onSuccess: (_data, { inventoryItemId }) => {
      qc.invalidateQueries({
        queryKey: inventoryKeys.detail(inventoryItemId),
      });
      qc.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      inventoryItemId,
      packageId,
    }: {
      inventoryItemId: string;
      packageId: string;
    }) =>
      apiClient.del(
        `/v1/inventory/${inventoryItemId}/packages/${packageId}`,
      ),
    onSuccess: (_data, { inventoryItemId }) => {
      qc.invalidateQueries({
        queryKey: inventoryKeys.detail(inventoryItemId),
      });
      qc.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useAddShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      inventoryItemId,
      ...data
    }: Partial<InventoryShipment> & { inventoryItemId: string }) =>
      apiClient.post<InventoryShipment>(
        `/v1/inventory/${inventoryItemId}/shipments`,
        data,
      ),
    onSuccess: (_data, { inventoryItemId }) => {
      qc.invalidateQueries({
        queryKey: inventoryKeys.detail(inventoryItemId),
      });
      qc.invalidateQueries({
        queryKey: inventoryKeys.shipments(inventoryItemId),
      });
      qc.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useInventoryShipments(id: string) {
  return useQuery({
    queryKey: inventoryKeys.shipments(id),
    queryFn: () =>
      apiClient.get<InventoryShipment[]>(
        `/v1/inventory/${id}/shipments`,
      ),
    enabled: !!id,
  });
}

export function useWriteOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      inventoryItemId: string;
      quantity: number;
      reason?: string;
    }) => apiClient.post('/v1/inventory/write-off', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}

export function useTransferInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      inventoryItemId: string;
      quantity: number;
      fromLocationId: string;
      toLocationId: string;
    }) => apiClient.post('/v1/inventory/transfer', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
    },
  });
}
