import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Pencil, Trash2, ShoppingBag, Sparkles, Type, Image, Leaf, Eye } from 'lucide-react';
import { toast } from 'sonner';
import type { Recipe } from '@bake-app/shared-types';
import {
  useRecipes,
  useDeleteRecipe,
  useCreateProduct,
  useGenerateRecipeFromUrl,
  useGenerateRecipeFromImage,
  useGenerateRecipeFromText,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  DataTable,
  LoadingSpinner,
  Modal,
  useConfirmation,
  type TableColumn,
} from '@bake-app/react/ui';

export function RecipesPage() {
  const navigate = useNavigate();
  const { data: recipes, isLoading } = useRecipes();
  const deleteRecipe = useDeleteRecipe();
  const createProduct = useCreateProduct();
  const generateFromUrl = useGenerateRecipeFromUrl();
  const generateFromImage = useGenerateRecipeFromImage();
  const generateFromText = useGenerateRecipeFromText();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categories = useMemo(() => {
    if (!recipes) return [];
    const unique = [...new Set(recipes.map((r: Recipe) => r.category).filter(Boolean))] as string[];
    return unique.sort();
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    if (!selectedCategory) return recipes;
    return recipes.filter((r: Recipe) => r.category === selectedCategory);
  }, [recipes, selectedCategory]);

  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiMode, setAiMode] = useState<'text' | 'image'>('text');
  const [aiText, setAiText] = useState('');
  const [aiImageBase64, setAiImageBase64] = useState('');
  const [aiImageName, setAiImageName] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  const openAiDialog = () => {
    setAiText('');
    setAiImageBase64('');
    setAiImageName('');
    setAiMode('text');
    setAiDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAiImageBase64(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleAiGenerate = async () => {
    setAiGenerating(true);
    try {
      let recipeData: any;
      if (aiMode === 'text') {
        const input = aiText.trim();
        if (!input) { toast.error('Please enter text or URL'); return; }
        const isUrl = /^https?:\/\//i.test(input);
        recipeData = isUrl
          ? await generateFromUrl.mutateAsync({ url: input })
          : await generateFromText.mutateAsync({ text: input });
      } else {
        if (!aiImageBase64) { toast.error('Please upload an image'); return; }
        recipeData = await generateFromImage.mutateAsync({ imageBase64: aiImageBase64 });
      }
      toast.success(`Recipe "${recipeData.name || 'New Recipe'}" parsed by AI`);
      setAiDialogOpen(false);
      navigate('/recipes/new', { state: { aiRecipeData: recipeData } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

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
        price: 0,
        costPrice: 0,
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
      width: '180px',
      actions: [
        {
          action: 'view',
          icon: <Eye size={16} />,
          tooltip: 'View recipe',
          color: 'text-emerald-500 hover:text-emerald-700',
          onClick: (row: Recipe) => navigate(`/recipes/${row.id}/view`),
        },
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/recipes/ingredients')}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-95"
          >
            <Leaf size={16} />
            Ingredients
          </button>
          <button
            type="button"
            onClick={openAiDialog}
            className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-all hover:bg-purple-100 active:scale-95"
          >
            <Sparkles size={16} />
            AI Generate
          </button>
          <button
            type="button"
            onClick={() => navigate('/recipes/new')}
            className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95"
          >
            <Plus size={16} />
            Add Recipe
          </button>
        </div>
      }
    >
      {isLoading ? (
        <LoadingSpinner message="Loading recipes..." />
      ) : (
        <DataTable
          columns={columns}
          data={filteredRecipes}
          searchable
          searchPlaceholder="Search recipes..."
          pageSize={25}
          toolbarExtra={
            categories.length > 0 ? (
              <div className="flex items-center gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('')}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            ) : undefined
          }
        />
      )}

      {ConfirmationDialog}

      {/* AI Generate Dialog */}
      <Modal
        open={aiDialogOpen}
        onClose={() => !aiGenerating && setAiDialogOpen(false)}
        title="AI Recipe Generator"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setAiDialogOpen(false)}
              disabled={aiGenerating}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={aiGenerating || (aiMode === 'text' ? !aiText.trim() : !aiImageBase64)}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-purple-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={16} className={aiGenerating ? 'animate-spin' : ''} />
              {aiGenerating ? 'Generating...' : 'Generate Recipe'}
            </button>
          </>
        }
      >
        <p className="mb-4 text-sm text-gray-500">
          Use AI to automatically create a recipe from text, a URL, or a photo.
        </p>

        {/* Mode Tabs */}
        <div className="mb-4 flex rounded-lg border border-gray-200 p-0.5">
          <button
            type="button"
            onClick={() => setAiMode('text')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              aiMode === 'text'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Type size={16} />
            Text / URL
          </button>
          <button
            type="button"
            onClick={() => setAiMode('image')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              aiMode === 'image'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Image size={16} />
            From Image
          </button>
        </div>

        {aiMode === 'text' ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-[#5d4037]">
              Recipe Text or URL
            </label>
            <textarea
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder="Paste a recipe URL or recipe text from clipboard..."
              rows={5}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-400/30 resize-y"
              autoFocus
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Paste a recipe URL or copy-paste recipe text. AI will extract the name, ingredients, instructions, and more.
            </p>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-[#5d4037]">
              Recipe Image
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center transition-colors hover:border-purple-300 hover:bg-purple-50/30">
              <Image size={32} className="mb-2 text-gray-300" />
              {aiImageName ? (
                <span className="text-sm font-medium text-[#3e2723]">{aiImageName}</span>
              ) : (
                <span className="text-sm text-gray-400">Click to upload a photo</span>
              )}
              <span className="mt-1 text-xs text-gray-400">JPG, PNG, or WEBP</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <p className="mt-1.5 text-xs text-gray-400">
              Upload a photo of a recipe card, cookbook page, or handwritten recipe.
            </p>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
