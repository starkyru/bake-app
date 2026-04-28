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
  dependencyTree: (id: string) =>
    [...recipeKeys.all, 'dependency-tree', id] as const,
  compositeCost: (id: string) =>
    [...recipeKeys.all, 'composite-cost', id] as const,
  usedIn: (id: string) => [...recipeKeys.all, 'used-in', id] as const,
};

export function useRecipes() {
  return useQuery({
    queryKey: recipeKeys.list(),
    queryFn: async () => {
      const res = await apiClient.get<any>('/v1/recipes', { limit: 1000 });
      return Array.isArray(res) ? res : (res?.data ?? []);
    },
  });
}

export function useRecipe(id: string, includeSubRecipes?: boolean) {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () =>
      apiClient.get<Recipe>(
        `/v1/recipes/${id}`,
        includeSubRecipes ? { includeSubRecipes: true } : undefined,
      ),
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

export interface RecipeCostResult {
  yieldQuantity: number;
  yieldUnit: string;
  ingredientsCost: number;
  ingredients: {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    note?: string;
    costPerUnit: number;
    lineCost: number;
  }[];
}

export function useRecipeCost(id: string) {
  return useQuery({
    queryKey: recipeKeys.cost(id),
    queryFn: () => apiClient.get<RecipeCostResult>(`/v1/recipes/${id}/cost`),
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
      scaleFactor: number;
    }) => apiClient.post<Recipe>(`/v1/recipes/${id}/scale`, data),
  });
}

export function useGenerateRecipeFromUrl() {
  return useMutation({
    mutationFn: (data: { url: string }) =>
      apiClient.post<any>('/v1/recipes/generate/from-url', data),
  });
}

export function useGenerateRecipeFromImage() {
  return useMutation({
    mutationFn: (data: { imageBase64: string; mimeType?: string }) =>
      apiClient.post<any>('/v1/recipes/generate/from-image', data),
  });
}

export function useGenerateRecipeFromText() {
  return useMutation({
    mutationFn: (data: { text: string }) =>
      apiClient.post<any>('/v1/recipes/generate/from-text', data),
  });
}

export function useUploadRecipeImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, file }: { recipeId: string; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      return apiClient.upload<any>(`/v1/recipes/${recipeId}/images`, formData);
    },
    onSuccess: (_data, { recipeId }) => {
      qc.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
    },
  });
}

export function useDeleteRecipeImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, imageId }: { recipeId: string; imageId: string }) =>
      apiClient.del(`/v1/recipes/${recipeId}/images/${imageId}`),
    onSuccess: (_data, { recipeId }) => {
      qc.invalidateQueries({ queryKey: recipeKeys.detail(recipeId) });
    },
  });
}

export function useRecipeDependencyTree(id: string) {
  return useQuery({
    queryKey: recipeKeys.dependencyTree(id),
    queryFn: () => apiClient.get<any>(`/v1/recipes/${id}/dependency-tree`),
    enabled: !!id,
  });
}

export function useRecipeCompositeCost(id: string) {
  return useQuery({
    queryKey: recipeKeys.compositeCost(id),
    queryFn: () => apiClient.get<any>(`/v1/recipes/${id}/composite-cost`),
    enabled: !!id,
  });
}

export function useRecipeUsedIn(id: string) {
  return useQuery({
    queryKey: recipeKeys.usedIn(id),
    queryFn: () => apiClient.get<any>(`/v1/recipes/${id}/used-in`),
    enabled: !!id,
  });
}

export function useSubRecipeSuggestions() {
  return useMutation({
    mutationFn: (data: { recipeId?: string; text?: string }) =>
      apiClient.post<any>('/v1/recipes/generate/analyze-sub-recipes', data),
  });
}
