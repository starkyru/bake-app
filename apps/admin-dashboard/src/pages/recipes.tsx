import { useNavigate } from 'react-router';
import { Plus, Pencil, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import type { Recipe } from '@bake-app/shared-types';
import {
  useRecipes,
  useDeleteRecipe,
  useCreateProduct,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  DataTable,
  LoadingSpinner,
  useConfirmation,
  type TableColumn,
} from '@bake-app/react/ui';

export function RecipesPage() {
  const navigate = useNavigate();
  const { data: recipes, isLoading } = useRecipes();
  const deleteRecipe = useDeleteRecipe();
  const createProduct = useCreateProduct();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const handleDelete = async (recipe: Recipe) => {
    const confirmed = await confirm(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.name}"? This action cannot be undone.`,
      { variant: 'danger', confirmText: 'Delete' },
    );
    if (!confirmed) return;
    try {
      await deleteRecipe.mutateAsync(recipe.id);
      toast.success('Recipe deleted');
    } catch {
      toast.error('Failed to delete recipe');
    }
  };

  const handleCreateMenuItem = async (recipe: Recipe) => {
    const confirmed = await confirm(
      'Create Menu Item',
      `Create a new menu item linked to recipe "${recipe.name}"?`,
      { confirmText: 'Create' },
    );
    if (!confirmed) return;
    try {
      await createProduct.mutateAsync({
        name: recipe.name,
        type: 'produced',
        price: recipe.costPerUnit * 2.5, // default markup
        costPrice: recipe.costPerUnit,
        recipeId: recipe.id,
        isActive: true,
      });
      toast.success('Menu item created from recipe');
    } catch {
      toast.error('Failed to create menu item');
    }
  };

  const columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value: string) => {
        if (!value) return <span className="text-sm text-gray-300">&mdash;</span>;
        const label = value
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return (
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600">
            {label}
          </span>
        );
      },
    },
    {
      key: 'yieldQuantity',
      label: 'Yield',
      sortable: true,
      render: (value: number, row: Recipe) => (
        <span className="text-sm text-gray-700">
          {value} {row.yieldUnit}
        </span>
      ),
    },
    {
      key: 'costPerUnit',
      label: 'Cost / Unit',
      type: 'currency',
      sortable: true,
    },
    {
      key: 'currentVersion',
      label: 'Version',
      render: (value: number) => (
        <span className="font-mono text-xs text-gray-500">v{value}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value: boolean) => (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            value
              ? 'border-green-200 bg-green-100 text-green-800'
              : 'border-gray-200 bg-gray-100 text-gray-600'
          }`}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sortable: false,
      width: '140px',
      actions: [
        {
          action: 'edit',
          icon: <Pencil size={16} />,
          tooltip: 'Edit recipe',
          onClick: (row: Recipe) => navigate(`/recipes/${row.id}`),
        },
        {
          action: 'create-product',
          icon: <ShoppingBag size={16} />,
          tooltip: 'Create menu item',
          color: 'text-blue-400 hover:text-blue-600',
          onClick: (row: Recipe) => handleCreateMenuItem(row),
        },
        {
          action: 'delete',
          icon: <Trash2 size={16} />,
          tooltip: 'Delete',
          color: 'text-red-400 hover:text-red-600',
          onClick: (row: Recipe) => handleDelete(row),
        },
      ],
    },
  ];

  return (
    <PageContainer
      title="Recipes"
      subtitle="Manage your bakery recipes"
      actions={
        <button
          type="button"
          onClick={() => navigate('/recipes/new')}
          className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95"
        >
          <Plus size={16} />
          Add Recipe
        </button>
      }
    >
      {isLoading ? (
        <LoadingSpinner message="Loading recipes..." />
      ) : (
        <DataTable
          columns={columns}
          data={recipes ?? []}
          searchable
          searchPlaceholder="Search recipes..."
          pageSize={25}
        />
      )}

      {ConfirmationDialog}
    </PageContainer>
  );
}
