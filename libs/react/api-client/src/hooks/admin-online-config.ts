import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';

export const adminOnlineConfigKeys = {
  all: ['admin-online-config'] as const,
  locationConfig: (locationId: string) =>
    [...adminOnlineConfigKeys.all, 'location-config', locationId] as const,
  locationMenus: (locationId: string) =>
    [...adminOnlineConfigKeys.all, 'location-menus', locationId] as const,
  menuConfig: (menuId: string) =>
    [...adminOnlineConfigKeys.all, 'menu-config', menuId] as const,
  menuSchedules: (menuId: string) =>
    [...adminOnlineConfigKeys.all, 'menu-schedules', menuId] as const,
  deliveryZones: (locationId: string) =>
    [...adminOnlineConfigKeys.all, 'delivery-zones', locationId] as const,
  productOptionGroups: (productId: string) =>
    [...adminOnlineConfigKeys.all, 'product-option-groups', productId] as const,
};

// Location config
export function useLocationConfig(locationId: string) {
  return useQuery({
    queryKey: adminOnlineConfigKeys.locationConfig(locationId),
    queryFn: () => apiClient.get(`/v1/admin/locations/${locationId}/config`),
    enabled: !!locationId,
  });
}

export function useUpdateLocationConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, ...data }: { locationId: string; [key: string]: unknown }) =>
      apiClient.put(`/v1/admin/locations/${locationId}/config`, data),
    onSuccess: (_data, { locationId }) => {
      qc.invalidateQueries({
        queryKey: adminOnlineConfigKeys.locationConfig(locationId),
      });
    },
  });
}

// Location menus
export function useLocationMenus(locationId: string) {
  return useQuery({
    queryKey: adminOnlineConfigKeys.locationMenus(locationId),
    queryFn: () => apiClient.get(`/v1/admin/locations/${locationId}/menus`),
    enabled: !!locationId,
  });
}

export function useAssignMenuToLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, menuId }: { locationId: string; menuId: string }) =>
      apiClient.post(`/v1/admin/locations/${locationId}/menus`, { menuId }),
    onSuccess: (_data, { locationId }) => {
      qc.invalidateQueries({
        queryKey: adminOnlineConfigKeys.locationMenus(locationId),
      });
    },
  });
}

export function useUnassignMenuFromLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, menuId }: { locationId: string; menuId: string }) =>
      apiClient.del(`/v1/admin/locations/${locationId}/menus/${menuId}`),
    onSuccess: (_data, { locationId }) => {
      qc.invalidateQueries({
        queryKey: adminOnlineConfigKeys.locationMenus(locationId),
      });
    },
  });
}

// Menu config
export function useMenuConfig(menuId: string) {
  return useQuery({
    queryKey: adminOnlineConfigKeys.menuConfig(menuId),
    queryFn: () => apiClient.get(`/v1/admin/menus/${menuId}/config`),
    enabled: !!menuId,
  });
}

export function useUpdateMenuConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, ...data }: { menuId: string; [key: string]: unknown }) =>
      apiClient.put(`/v1/admin/menus/${menuId}/config`, data),
    onSuccess: (_data, { menuId }) => {
      qc.invalidateQueries({
        queryKey: adminOnlineConfigKeys.menuConfig(menuId),
      });
    },
  });
}

// Menu schedules
export function useMenuSchedules(menuId: string) {
  return useQuery({
    queryKey: adminOnlineConfigKeys.menuSchedules(menuId),
    queryFn: () => apiClient.get(`/v1/admin/menus/${menuId}/schedules`),
    enabled: !!menuId,
  });
}

export function useCreateMenuSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, ...data }: { menuId: string; [key: string]: unknown }) =>
      apiClient.post(`/v1/admin/menus/${menuId}/schedules`, data),
    onSuccess: (_data, { menuId }) => {
      qc.invalidateQueries({
        queryKey: adminOnlineConfigKeys.menuSchedules(menuId),
      });
    },
  });
}

export function useDeleteMenuSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, scheduleId }: { menuId: string; scheduleId: string }) =>
      apiClient.del(`/v1/admin/menus/${menuId}/schedules/${scheduleId}`),
    onSuccess: (_data, { menuId }) => {
      qc.invalidateQueries({
        queryKey: adminOnlineConfigKeys.menuSchedules(menuId),
      });
    },
  });
}

// Delivery zones
export function useDeliveryZones(locationId: string) {
  return useQuery({
    queryKey: adminOnlineConfigKeys.deliveryZones(locationId),
    queryFn: () => apiClient.get(`/v1/admin/locations/${locationId}/delivery-zones`),
    enabled: !!locationId,
  });
}

export function useCreateDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, ...data }: { locationId: string; [key: string]: unknown }) =>
      apiClient.post(`/v1/admin/locations/${locationId}/delivery-zones`, data),
    onSuccess: (_data, { locationId }) => {
      qc.invalidateQueries({
        queryKey: adminOnlineConfigKeys.deliveryZones(locationId),
      });
    },
  });
}

export function useUpdateDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      locationId,
      zoneId,
      ...data
    }: {
      locationId: string;
      zoneId: string;
      [key: string]: unknown;
    }) => apiClient.put(`/v1/admin/locations/${locationId}/delivery-zones/${zoneId}`, data),
    onSuccess: (_data, { locationId }) => {
      qc.invalidateQueries({
        queryKey: adminOnlineConfigKeys.deliveryZones(locationId),
      });
    },
  });
}

export function useDeleteDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, zoneId }: { locationId: string; zoneId: string }) =>
      apiClient.del(`/v1/admin/locations/${locationId}/delivery-zones/${zoneId}`),
    onSuccess: (_data, { locationId }) => {
      qc.invalidateQueries({
        queryKey: adminOnlineConfigKeys.deliveryZones(locationId),
      });
    },
  });
}

// Product option groups
export function useProductOptionGroups(productId: string) {
  return useQuery({
    queryKey: adminOnlineConfigKeys.productOptionGroups(productId),
    queryFn: () => apiClient.get(`/v1/products/${productId}/option-groups`),
    enabled: !!productId,
  });
}

export function useCreateProductOptionGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, ...data }: { productId: string; [key: string]: unknown }) =>
      apiClient.post(`/v1/products/${productId}/option-groups`, data),
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({
        queryKey: adminOnlineConfigKeys.productOptionGroups(productId),
      });
    },
  });
}

export function useCreateProductOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      groupId,
      ...data
    }: {
      productId: string;
      groupId: string;
      [key: string]: unknown;
    }) => apiClient.post(`/v1/products/${productId}/option-groups/${groupId}/options`, data),
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({
        queryKey: adminOnlineConfigKeys.productOptionGroups(productId),
      });
    },
  });
}

export function useUpdateProductOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      groupId,
      optionId,
      ...data
    }: {
      productId: string;
      groupId: string;
      optionId: string;
      [key: string]: unknown;
    }) =>
      apiClient.put(
        `/v1/products/${productId}/option-groups/${groupId}/options/${optionId}`,
        data,
      ),
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({
        queryKey: adminOnlineConfigKeys.productOptionGroups(productId),
      });
    },
  });
}

export function useDeleteProductOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      groupId,
      optionId,
    }: {
      productId: string;
      groupId: string;
      optionId: string;
    }) =>
      apiClient.del(
        `/v1/products/${productId}/option-groups/${groupId}/options/${optionId}`,
      ),
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({
        queryKey: adminOnlineConfigKeys.productOptionGroups(productId),
      });
    },
  });
}

export function useDeleteProductOptionGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, groupId }: { productId: string; groupId: string }) =>
      apiClient.del(`/v1/products/${productId}/option-groups/${groupId}`),
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({
        queryKey: adminOnlineConfigKeys.productOptionGroups(productId),
      });
    },
  });
}
