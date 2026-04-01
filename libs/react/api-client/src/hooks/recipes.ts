import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { Recipe } from '@bake-app/shared-types';

export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: () => [...recipeKeys.lists()] as const,
  details: () => [...recipeKeys.all, 'detail'] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
  cost: (id: string) => [...recipeKeys.all, 'cost', id] as const,
};

export function useRecipes() {
  return useQuery({
    queryKey: recipeKeys.list(),
    queryFn: () => apiClient.get<Recipe[]>('/v1/recipes'),
  });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => apiClient.get<Recipe>(`/v1/recipes/${id}`),
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Recipe>) =>
      apiClient.post<Recipe>('/v1/recipes', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Recipe> & { id: string }) =>
      apiClient.put<Recipe>(`/v1/recipes/${id}`, data),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: recipeKeys.lists() });
      qc.invalidateQueries({ queryKey: recipeKeys.detail(id) });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.del(`/v1/recipes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

export function useRecipeCost(id: string) {
  return useQuery({
    queryKey: recipeKeys.cost(id),
    queryFn: () =>
      apiClient.get<{ totalCost: number; costPerUnit: number }>(
        `/v1/recipes/${id}/cost`,
      ),
    enabled: !!id,
  });
}

export function useScaleRecipe() {
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      targetYield: number;
    }) => apiClient.post<Recipe>(`/v1/recipes/${id}/scale`, data),
  });
}

export function useGenerateRecipeFromUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { url: string }) =>
      apiClient.post<Recipe>('/v1/recipes/generate/from-url', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

export function useGenerateRecipeFromImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { image: string }) =>
      apiClient.post<Recipe>('/v1/recipes/generate/from-image', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}
