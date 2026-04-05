import { useQuery } from '@tanstack/react-query';
import { customerApiClient } from '@bake-app/react/customer-auth';

export const onlineMenuKeys = {
  all: ['online-menus'] as const,
  lists: () => [...onlineMenuKeys.all, 'list'] as const,
  list: (locationId: string, date?: string, time?: string) =>
    [...onlineMenuKeys.lists(), locationId, date, time] as const,
  availableDates: (locationId: string) =>
    [...onlineMenuKeys.all, 'available-dates', locationId] as const,
};

export function useOnlineMenus(locationId: string, date?: string, time?: string) {
  return useQuery({
    queryKey: onlineMenuKeys.list(locationId, date, time),
    queryFn: () =>
      customerApiClient.get(`/v1/storefront/locations/${locationId}/menus`, {
        date,
        time,
      }),
    enabled: !!locationId,
  });
}

export function useAvailableDates(locationId: string) {
  return useQuery({
    queryKey: onlineMenuKeys.availableDates(locationId),
    queryFn: () =>
      customerApiClient.get(`/v1/storefront/locations/${locationId}/menus/available-dates`),
    enabled: !!locationId,
  });
}
