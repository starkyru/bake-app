import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import type { IngredientCategory } from '@bake-app/shared-types';

export const ingredientCategoryKeys = {
  all: ['ingredient-categories'] as const,
  list: () => [...ingredientCategoryKeys.all, 'list'] as const,
};

export function useIngredientCategories() {
  return useQuery({
    queryKey: ingredientCategoryKeys.list(),
    queryFn: () =>
      apiClient.get<IngredientCategory[]>('/v1/ingredient-categories'),
  });
}

export function useCreateIngredientCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IngredientCategory>) =>
      apiClient.post<IngredientCategory>('/v1/ingredient-categories', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ingredientCategoryKeys.all });
    },
  });
}

export function useUpdateIngredientCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: Partial<IngredientCategory> & { id: string }) =>
      apiClient.put<IngredientCategory>(
        `/v1/ingredient-categories/${id}`,
        data,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ingredientCategoryKeys.all });
    },
  });
}

export function useDeleteIngredientCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.del(`/v1/ingredient-categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ingredientCategoryKeys.all });
    },
  });
}
