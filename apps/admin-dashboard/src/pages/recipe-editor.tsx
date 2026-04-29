import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import {
  ImagePlus,
  Plus,
  Trash2,
  Save,
  Link as LinkIcon,
  Video,
  Search,
  Sparkles,
  X,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  RecipeIngredient,
  RecipeLink,
  RecipeImage,
  Ingredient,
  Recipe,
} from '@bake-app/shared-types';
import {
  useRecipe,
  useRecipes,
  useCreateRecipe,
  useUpdateRecipe,
  useIngredients,
  useIngredientCategories,
  useRecipeCost,
  useUploadRecipeImage,
  useDeleteRecipeImage,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  LoadingSpinner,
  DurationInput,
} from '@bake-app/react/ui';
import { CostEstimate } from '../components/cost-estimate';
import { AiSubRecipeSuggestions } from '../components/ai-sub-recipe-suggestions';

const UNIT_OPTIONS = ['g', 'kg', 'ml', 'L', 'pcs', 'oz', 'lb', 'tbsp', 'tsp'];

const UNIT_ALIASES: Record<string, string> = {
  l: 'L',
  liter: 'L',
  liters: 'L',
  litre: 'L',
  litres: 'L',
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  piece: 'pcs',
  pieces: 'pcs',
  ounce: 'oz',
  ounces: 'oz',
  pound: 'lb',
  pounds: 'lb',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
};

const UNIT_GROUPS: Record<string, string[]> = {
  g: ['g', 'kg'],
  kg: ['g', 'kg'],
  ml: ['ml', 'L', 'tbsp', 'tsp'],
  L: ['ml', 'L', 'tbsp', 'tsp'],
  tbsp: ['ml', 'L', 'tbsp', 'tsp'],
  tsp: ['ml', 'L', 'tbsp', 'tsp'],
  oz: ['oz', 'lb', 'g', 'kg'],
  lb: ['oz', 'lb', 'g', 'kg'],
  pcs: ['pcs'],
};

function getCompatibleUnits(baseUnit: string): string[] {
  return UNIT_GROUPS[baseUnit] || UNIT_OPTIONS;
}

function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase().trim();
  if (UNIT_OPTIONS.includes(unit)) return unit;
  if (UNIT_ALIASES[lower]) return UNIT_ALIASES[lower];
  // Check case-insensitive match against UNIT_OPTIONS
  const found = UNIT_OPTIONS.find((u) => u.toLowerCase() === lower);
  return found ?? 'g';
}

function fuzzyScore(a: string, b: string): number {
  const al = a.toLowerCase().trim();
  const bl = b.toLowerCase().trim();
  if (al === bl) return 1;
  if (al.includes(bl) || bl.includes(al)) {
    return 0.9;
  }
  // Simple normalized Levenshtein
  const maxLen = Math.max(al.length, bl.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(al, bl);
  return 1 - dist / maxLen;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

const YIELD_UNIT_OPTIONS = ['pcs', 'kg', 'g', 'L', 'ml', 'loaves', 'cakes', 'servings', 'batches'];

const RECIPE_CATEGORIES = ['bread', 'pastry', 'cake', 'beverage', 'sandwich', 'other'] as const;
const CATEGORY_OPTIONS = RECIPE_CATEGORIES.map((val) => ({
  value: val,
  label: val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

interface RecipeIngredientRow {
  id?: string;
  ingredientId: string;
  ingredientName: string;
  quantity: string;
  unit: string;
  note?: string;
  isNew?: boolean;
  suggestedCategory?: string;
}

interface RecipeLinkRow {
  id?: string;
  url: string;
  title: string;
}

interface SubRecipeRow {
  subRecipeId: string;
  subRecipeName: string;
  quantity: number;
  unit: string;
  note: string;
}

const SUB_RECIPE_UNIT_OPTIONS = ['batches', 'g', 'kg', 'ml', 'L', 'pcs'];

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return match?.[1] ?? null;
}

export function RecipeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = id === 'new';
  const aiRecipeData = (location.state as any)?.aiRecipeData;

  const { data: existingRecipe, isLoading: recipeLoading } = useRecipe(
    isNew ? '' : id!,
    true,
  );
  const { data: allRecipes } = useRecipes() as { data: Recipe[] | undefined };
  const { data: allIngredients } = useIngredients() as { data: Ingredient[] | undefined };
  const { data: ingredientCategories } = useIngredientCategories();
  const { data: recipeCost } = useRecipeCost(isNew ? '' : id!);
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const uploadImage = useUploadRecipeImage();
  const deleteImage = useDeleteRecipeImage();

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [yieldQuantity, setYieldQuantity] = useState('');
  const [yieldUnit, setYieldUnit] = useState('pcs');
  const [instructions, setInstructions] = useState('');
  const [ingredientRows, setIngredientRows] = useState<RecipeIngredientRow[]>(
    [],
  );
  const [linkRows, setLinkRows] = useState<RecipeLinkRow[]>([]);
  const [subRecipeRows, setSubRecipeRows] = useState<SubRecipeRow[]>([]);
  const [storageLife, setStorageLife] = useState<{
    roomTempHours?: number;
    refrigeratedHours?: number;
    frozenHours?: number;
    thawedHours?: number;
  }>({});
  const [saving, setSaving] = useState(false);

  // Ingredient autocomplete state
  const [activeIngredientIdx, setActiveIngredientIdx] = useState<number | null>(
    null,
  );
  const [ingredientSearch, setIngredientSearch] = useState('');

  // Sub-recipe autocomplete state
  const [activeSubRecipeIdx, setActiveSubRecipeIdx] = useState<number | null>(null);
  const [subRecipeSearch, setSubRecipeSearch] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (existingRecipe && !isNew) {
      setName(existingRecipe.name);
      setCategory(existingRecipe.category ?? '');
      setYieldQuantity(String(existingRecipe.yieldQuantity));
      setYieldUnit(existingRecipe.yieldUnit);
      setInstructions(existingRecipe.instructions ?? '');
      setIngredientRows(
        (existingRecipe.ingredients ?? []).map((ri) => ({
          id: ri.id,
          ingredientId: ri.ingredientId,
          ingredientName: ri.ingredientName ?? '',
          quantity: String(ri.quantity),
          unit: ri.unit,
          note: ri.note ?? '',
        })),
      );
      setLinkRows(
        (existingRecipe.links ?? []).map((l) => ({
          id: l.id,
          url: l.url,
          title: l.title ?? '',
        })),
      );
      setSubRecipeRows(
        (existingRecipe.subRecipes ?? []).map((sr) => ({
          subRecipeId: sr.subRecipeId,
          subRecipeName: sr.subRecipe?.name ?? '',
          quantity: sr.quantity,
          unit: sr.unit,
          note: sr.note ?? '',
        })),
      );
      setStorageLife({
        roomTempHours: existingRecipe.roomTempHours ?? undefined,
        refrigeratedHours: existingRecipe.refrigeratedHours ?? undefined,
        frozenHours: existingRecipe.frozenHours ?? undefined,
        thawedHours: existingRecipe.thawedHours ?? undefined,
      });
    }
  }, [existingRecipe, isNew]);

  // Populate from AI data
  useEffect(() => {
    if (!aiRecipeData || !allIngredients) return;
    setName(aiRecipeData.name || '');
    setCategory(aiRecipeData.category || '');
    setYieldQuantity(String(aiRecipeData.yieldQuantity || 1));
    setYieldUnit(aiRecipeData.yieldUnit || 'pcs');
    setInstructions(aiRecipeData.instructions || '');

    // Match AI ingredients against existing catalog
    const rows: RecipeIngredientRow[] = (aiRecipeData.ingredients || []).map(
      (aiIng: any) => {
        const unit = normalizeUnit(aiIng.unit || 'g');
        const ingredientName = aiIng.ingredientName || aiIng.ingredientId || '';

        // Try to fuzzy match against existing ingredients
        let bestMatch: Ingredient | null = null;
        let bestScore = 0;
        for (const existing of allIngredients) {
          const score = fuzzyScore(ingredientName, existing.name);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = existing;
          }
        }

        if (bestMatch && bestScore >= 0.85) {
          return {
            ingredientId: bestMatch.id,
            ingredientName: bestMatch.name,
            quantity: String(aiIng.quantity || 0),
            unit: bestMatch.unit || unit,
            note: aiIng.note || '',
          };
        }

        // No good match — mark as new
        return {
          ingredientId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          ingredientName,
          quantity: String(aiIng.quantity || 0),
          unit,
          note: aiIng.note || '',
          isNew: true,
          suggestedCategory: aiIng.ingredientCategory || '',
        };
      },
    );

    setIngredientRows(rows);

    // Links
    if (aiRecipeData.links) {
      setLinkRows(
        aiRecipeData.links.map((l: any) => ({
          url: l.url || '',
          title: l.title || '',
        })),
      );
    }
  }, [aiRecipeData, allIngredients]);

  const filteredIngredients = useMemo(() => {
    if (!allIngredients) return [];
    const query = ingredientSearch.toLowerCase();
    return allIngredients.filter(
      (ing) =>
        ing.name.toLowerCase().includes(query) &&
        !ingredientRows.some((r) => r.ingredientId === ing.id && !r.isNew),
    );
  }, [allIngredients, ingredientSearch, ingredientRows]);

  const filteredRecipesForSubRecipe = useMemo(() => {
    if (!allRecipes) return [];
    const query = subRecipeSearch.toLowerCase();
    return allRecipes.filter(
      (r) =>
        r.id !== id &&
        r.name.toLowerCase().includes(query) &&
        !subRecipeRows.some((sr) => sr.subRecipeId === r.id),
    );
  }, [allRecipes, subRecipeSearch, subRecipeRows, id]);

  // Sub-recipe row management
  const addSubRecipeRow = () => {
    setSubRecipeRows((rows) => [
      ...rows,
      { subRecipeId: '', subRecipeName: '', quantity: 1, unit: 'batches', note: '' },
    ]);
  };

  const removeSubRecipeRow = (idx: number) => {
    setSubRecipeRows((rows) => rows.filter((_, i) => i !== idx));
  };

  const selectSubRecipe = (idx: number, recipe: Recipe) => {
    setSubRecipeRows((rows) =>
      rows.map((row, i) =>
        i === idx
          ? { ...row, subRecipeId: recipe.id, subRecipeName: recipe.name }
          : row,
      ),
    );
    setActiveSubRecipeIdx(null);
    setSubRecipeSearch('');
  };

  const updateSubRecipeRow = (
    idx: number,
    field: keyof SubRecipeRow,
    value: string | number,
  ) => {
    setSubRecipeRows((rows) =>
      rows.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  };

  // AI sub-recipe suggestion handlers
  const handleLinkSubRecipe = (suggestion: {
    existingRecipeId: string;
    matchedIngredientNames: string[];
  }) => {
    const recipe = allRecipes?.find((r) => r.id === suggestion.existingRecipeId);
    if (!recipe) return;

    // Remove matched ingredients from ingredient rows
    const lowerMatched = new Set(
      suggestion.matchedIngredientNames.map((n) => n.toLowerCase().trim()),
    );
    setIngredientRows((rows) =>
      rows.filter(
        (row) => !lowerMatched.has(row.ingredientName.toLowerCase().trim()),
      ),
    );

    // Add as sub-recipe if not already present
    setSubRecipeRows((rows) => {
      if (rows.some((sr) => sr.subRecipeId === recipe.id)) return rows;
      return [
        ...rows,
        {
          subRecipeId: recipe.id,
          subRecipeName: recipe.name,
          quantity: 1,
          unit: 'batches',
          note: '',
        },
      ];
    });
  };

  const handleCreateSubRecipe = async (suggestion: {
    suggestedName: string;
    matchedIngredientNames: string[];
    matchedSteps?: string;
    ingredients: any[];
  }) => {
    try {
      const newRecipe = await createRecipe.mutateAsync({
        name: suggestion.suggestedName,
        category: 'other',
        yieldQuantity: 1,
        yieldUnit: 'batches',
        instructions: suggestion.matchedSteps || '',
        ingredients: suggestion.ingredients.map((ing: any) => ({
          ingredientId: ing.ingredientId || '',
          ingredientName: ing.ingredientName || '',
          quantity: ing.quantity || 0,
          unit: ing.unit || 'g',
          note: ing.note,
          isNew: ing.isNew,
          ingredientCategory: ing.ingredientCategory,
        })) as any,
      });

      // Remove matched ingredients from the current recipe
      const lowerMatched = new Set(
        suggestion.matchedIngredientNames.map((n) => n.toLowerCase().trim()),
      );
      setIngredientRows((rows) =>
        rows.filter(
          (row) => !lowerMatched.has(row.ingredientName.toLowerCase().trim()),
        ),
      );

      // Add the newly created recipe as a sub-recipe
      setSubRecipeRows((rows) => [
        ...rows,
        {
          subRecipeId: newRecipe.id,
          subRecipeName: newRecipe.name,
          quantity: 1,
          unit: 'batches',
          note: '',
        },
      ]);

      toast.success(`Sub-recipe "${suggestion.suggestedName}" created`);
    } catch {
      toast.error('Failed to create sub-recipe');
    }
  };

  // Ingredient row management
  const addIngredientRow = () => {
    setIngredientRows((rows) => [
      ...rows,
      {
        ingredientId: '',
        ingredientName: '',
        quantity: '',
        unit: 'g',
      },
    ]);
  };

  const removeIngredientRow = (idx: number) => {
    setIngredientRows((rows) => rows.filter((_, i) => i !== idx));
  };

  const selectIngredient = (idx: number, ingredient: Ingredient) => {
    setIngredientRows((rows) =>
      rows.map((row, i) =>
        i === idx
          ? {
              ...row,
              ingredientId: ingredient.id,
              ingredientName: ingredient.name,
              unit: ingredient.unit,
              isNew: undefined,
              suggestedCategory: undefined,
            }
          : row,
      ),
    );
    setActiveIngredientIdx(null);
    setIngredientSearch('');
  };

  const createNewIngredientInline = (idx: number, ingredientName: string) => {
    setIngredientRows((rows) =>
      rows.map((row, i) =>
        i === idx
          ? {
              ...row,
              ingredientId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              ingredientName,
              isNew: true,
              suggestedCategory: '',
            }
          : row,
      ),
    );
    setActiveIngredientIdx(null);
    setIngredientSearch('');
  };

  const updateIngredientRow = (
    idx: number,
    field: keyof RecipeIngredientRow,
    value: string,
  ) => {
    setIngredientRows((rows) =>
      rows.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  };

  // Link row management
  const addLinkRow = () => {
    setLinkRows((rows) => [...rows, { url: '', title: '' }]);
  };

  const removeLinkRow = (idx: number) => {
    setLinkRows((rows) => rows.filter((_, i) => i !== idx));
  };

  const updateLinkRow = (
    idx: number,
    field: keyof RecipeLinkRow,
    value: string,
  ) => {
    setLinkRows((rows) =>
      rows.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Recipe name is required');
      return;
    }
    if (!yieldQuantity || parseFloat(yieldQuantity) <= 0) {
      toast.error('Yield quantity must be greater than zero');
      return;
    }

    setSaving(true);

    const ingredients = ingredientRows
      .filter((r) => r.ingredientId || r.isNew)
      .map((r) => ({
        ingredientId: r.ingredientId,
        ingredientName: r.ingredientName,
        quantity: parseFloat(r.quantity) || 0,
        unit: r.unit,
        note: r.note?.trim() || undefined,
        ...(r.isNew && { isNew: true, ingredientCategory: r.suggestedCategory || undefined }),
      }));

    const links: Partial<RecipeLink>[] = linkRows
      .filter((l) => l.url.trim())
      .map((l) => {
        const ytId = extractYouTubeId(l.url);
        return {
          url: l.url.trim(),
          title: l.title.trim() || undefined,
          isYoutube: !!ytId,
          youtubeVideoId: ytId ?? undefined,
        };
      });

    const subRecipes = subRecipeRows
      .filter((sr) => sr.subRecipeId)
      .map((sr) => ({
        subRecipeId: sr.subRecipeId,
        quantity: sr.quantity,
        unit: sr.unit,
        note: sr.note?.trim() || undefined,
      }));

    const payload = {
      name: name.trim(),
      category: category || undefined,
      yieldQuantity: parseFloat(yieldQuantity),
      yieldUnit,
      instructions: instructions.trim() || undefined,
      ingredients,
      links,
      subRecipes,
      roomTempHours: storageLife.roomTempHours ?? undefined,
      refrigeratedHours: storageLife.refrigeratedHours ?? undefined,
      frozenHours: storageLife.frozenHours ?? undefined,
      thawedHours: storageLife.thawedHours ?? undefined,
    };

    try {
      if (isNew) {
        const created = await createRecipe.mutateAsync(payload as any);
        toast.success('Recipe created');
        navigate(`/recipes/${created.id}`, { replace: true });
      } else {
        await updateRecipe.mutateAsync({ id: id!, ...payload } as any);
        toast.success('Recipe updated');
      }
    } catch {
      toast.error(isNew ? 'Failed to create recipe' : 'Failed to update recipe');
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && recipeLoading) {
    return (
      <PageContainer>
        <LoadingSpinner message="Loading recipe..." />
      </PageContainer>
    );
  }

  const newIngredientsCount = ingredientRows.filter((r) => r.isNew).length;

  return (
    <PageContainer
      title={isNew ? 'New Recipe' : `Edit: ${name || 'Recipe'}`}
      subtitle={
        isNew ? 'Create a new recipe' : 'Edit recipe details and ingredients'
      }
      backPath="/recipes"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Recipe'}
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-[1000px] space-y-6">
        {/* AI-generated notice */}
        {aiRecipeData && (
          <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700">
            <Sparkles size={16} />
            <span>
              AI-generated recipe. Review the ingredients below
              {newIngredientsCount > 0 && (
                <> &mdash; <strong>{newIngredientsCount} new ingredient{newIngredientsCount > 1 ? 's' : ''}</strong> will be created on save</>
              )}
              .
            </span>
          </div>
        )}

        {/* Basic Info */}
        <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-[#3e2723]">
            Basic Information
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[#5d4037]">
                Recipe Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                placeholder="e.g. Sourdough Bread"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#5d4037]">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-[#5d4037]">
                  Yield *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={yieldQuantity}
                  onChange={(e) => setYieldQuantity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="10"
                />
              </div>
              <div className="w-36">
                <label className="block text-sm font-medium text-[#5d4037]">
                  Unit
                </label>
                <select
                  value={yieldUnit}
                  onChange={(e) => setYieldUnit(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                >
                  {YIELD_UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-[#5d4037]">
              Instructions
            </label>
            <textarea
              ref={(el) => {
                if (el) {
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 500) + 'px';
                }
              }}
              value={instructions}
              onChange={(e) => {
                setInstructions(e.target.value);
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 500) + 'px';
              }}
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
              style={{ maxHeight: 500, overflow: 'auto' }}
              placeholder="Step-by-step instructions..."
            />
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#3e2723]">
              Ingredients
            </h3>
            <button
              type="button"
              onClick={addIngredientRow}
              className="flex items-center gap-1.5 rounded-lg border border-[#8b4513]/20 px-3 py-1.5 text-sm font-medium text-[#8b4513] transition-all hover:bg-[#faf3e8]"
            >
              <Plus size={14} />
              Add Row
            </button>
          </div>

          {ingredientRows.length === 0 ? (
            <div className="mt-4 rounded-lg border-2 border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
              No ingredients added yet. Click "Add Row" to start.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                      Ingredient
                    </th>
                    <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037] w-36">
                      Note
                    </th>
                    <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037] w-28">
                      Quantity
                    </th>
                    <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037] w-24">
                      Unit
                    </th>
                    <th className="pb-2 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {ingredientRows.map((row, idx) => {
                    return (
                      <tr key={idx} className="border-b border-gray-50">
                        <td className="py-2 pr-2">
                          <div className="relative">
                            {row.ingredientId && !row.isNew ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-[#3e2723]">
                                  {row.ingredientName}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateIngredientRow(idx, 'ingredientId', '');
                                    updateIngredientRow(
                                      idx,
                                      'ingredientName',
                                      '',
                                    );
                                    setActiveIngredientIdx(idx);
                                    setIngredientSearch('');
                                  }}
                                  className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                  change
                                </button>
                              </div>
                            ) : row.isNew && activeIngredientIdx !== idx ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={row.ingredientName}
                                    onChange={(e) =>
                                      updateIngredientRow(idx, 'ingredientName', e.target.value)
                                    }
                                    className="rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-[#3e2723] hover:border-gray-200 focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                                  />
                                  <span className="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                                    New
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveIngredientIdx(idx);
                                      setIngredientSearch(row.ingredientName);
                                    }}
                                    className="text-xs text-blue-500 hover:text-blue-700"
                                  >
                                    link to existing
                                  </button>
                                </div>
                                <select
                                  value={row.suggestedCategory || ''}
                                  onChange={(e) =>
                                    updateIngredientRow(idx, 'suggestedCategory' as any, e.target.value)
                                  }
                                  className="w-40 rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600 focus:border-[#8b4513] focus:outline-none"
                                >
                                  <option value="">Category...</option>
                                  {ingredientCategories?.map((cat: any) => (
                                    <option key={cat.id} value={cat.name}>
                                      {cat.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <>
                                <div className="relative flex items-center gap-1">
                                  <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                                    <input
                                      type="text"
                                      value={
                                        activeIngredientIdx === idx
                                          ? ingredientSearch
                                          : ''
                                      }
                                      onChange={(e) => {
                                        setIngredientSearch(e.target.value);
                                        setActiveIngredientIdx(idx);
                                      }}
                                      onFocus={() => {
                                        setActiveIngredientIdx(idx);
                                        if (!ingredientSearch) setIngredientSearch('');
                                      }}
                                      placeholder="Search ingredient..."
                                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                                    />
                                  </div>
                                  {row.isNew && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveIngredientIdx(null);
                                        setIngredientSearch('');
                                      }}
                                      className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap"
                                    >
                                      cancel
                                    </button>
                                  )}
                                </div>
                                {activeIngredientIdx === idx && (
                                  <div className="absolute z-10 mt-1 max-h-48 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                    {filteredIngredients.length === 0 && !ingredientSearch.trim() ? (
                                      <div className="px-3 py-2 text-sm text-gray-400">
                                        No ingredients found
                                      </div>
                                    ) : (
                                      <>
                                        {filteredIngredients
                                          .slice(0, 20)
                                          .map((ing) => (
                                            <button
                                              key={ing.id}
                                              type="button"
                                              onClick={() =>
                                                selectIngredient(idx, ing)
                                              }
                                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-[#faf3e8]/60"
                                            >
                                              <span className="text-[#3e2723]">
                                                {ing.name}
                                              </span>
                                              <span className="text-xs text-gray-400">
                                                {ing.unit}
                                              </span>
                                            </button>
                                          ))}
                                        {ingredientSearch.trim() && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              createNewIngredientInline(idx, ingredientSearch.trim())
                                            }
                                            className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2 text-left text-sm font-medium text-green-700 hover:bg-green-50"
                                          >
                                            <Plus size={14} />
                                            Create &ldquo;{ingredientSearch.trim()}&rdquo;
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={row.note || ''}
                            onChange={(e) =>
                              updateIngredientRow(idx, 'note', e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                            placeholder="e.g. sifted"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={row.quantity}
                            onChange={(e) =>
                              updateIngredientRow(idx, 'quantity', e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-2 pr-2">
                          <select
                            value={row.unit}
                            onChange={(e) =>
                              updateIngredientRow(idx, 'unit', e.target.value)
                            }
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                          >
                            {getCompatibleUnits(row.unit).map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() => removeIngredientRow(idx)}
                            className="rounded-lg p-1 text-red-400 transition-all hover:bg-red-50 hover:text-red-600"
                            title="Remove ingredient"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

            </div>
          )}

          {/* Cost Estimate (FIFO from inventory) */}
          {recipeCost && <div className="mt-4"><CostEstimate recipeCost={recipeCost} /></div>}
        </div>

        {/* AI Sub-Recipe Suggestions */}
        {aiRecipeData && allRecipes && (
          <AiSubRecipeSuggestions
            aiRecipeData={aiRecipeData}
            existingRecipes={allRecipes}
            onLinkSubRecipe={handleLinkSubRecipe}
            onCreateSubRecipe={handleCreateSubRecipe}
            onDismiss={() => {}}
          />
        )}

        {/* Sub-Recipes Section */}
        <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#3e2723]">
              Sub-Recipes
            </h3>
            <button
              type="button"
              onClick={addSubRecipeRow}
              className="flex items-center gap-1.5 rounded-lg border border-purple-300 px-3 py-1.5 text-sm font-medium text-purple-700 transition-all hover:bg-purple-50"
            >
              <Plus size={14} />
              Add Sub-Recipe
            </button>
          </div>

          {subRecipeRows.length === 0 ? (
            <div className="mt-4 rounded-lg border-2 border-dashed border-purple-200 bg-purple-50/20 py-8 text-center text-sm text-gray-400">
              No sub-recipes added yet. Use sub-recipes for components like fillings, frostings, or
              pre-ferments that are their own recipes.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {subRecipeRows.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-lg border-l-4 border-purple-300 bg-purple-50/30 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="relative">
                      {row.subRecipeId ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[#3e2723]">
                            {row.subRecipeName}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              updateSubRecipeRow(idx, 'subRecipeId', '');
                              updateSubRecipeRow(idx, 'subRecipeName', '');
                              setActiveSubRecipeIdx(idx);
                              setSubRecipeSearch('');
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            change
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={activeSubRecipeIdx === idx ? subRecipeSearch : ''}
                              onChange={(e) => {
                                setSubRecipeSearch(e.target.value);
                                setActiveSubRecipeIdx(idx);
                              }}
                              onFocus={() => {
                                setActiveSubRecipeIdx(idx);
                                if (!subRecipeSearch) setSubRecipeSearch('');
                              }}
                              placeholder="Search recipe..."
                              className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-300/50"
                            />
                          </div>
                          {activeSubRecipeIdx === idx && (
                            <div className="absolute z-10 mt-1 max-h-48 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                              {filteredRecipesForSubRecipe.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-gray-400">
                                  No recipes found
                                </div>
                              ) : (
                                filteredRecipesForSubRecipe.slice(0, 20).map((r) => (
                                  <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => selectSubRecipe(idx, r)}
                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-purple-50"
                                  >
                                    <span className="text-[#3e2723]">{r.name}</span>
                                    <span className="text-xs text-gray-400">{r.category}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.quantity}
                      onChange={(e) =>
                        updateSubRecipeRow(idx, 'quantity', parseFloat(e.target.value) || 0)
                      }
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 font-mono text-sm focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-300/50"
                      placeholder="1"
                    />
                  </div>
                  <div className="w-28">
                    <select
                      value={row.unit}
                      onChange={(e) => updateSubRecipeRow(idx, 'unit', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-300/50"
                    >
                      {SUB_RECIPE_UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-32">
                    <input
                      type="text"
                      value={row.note}
                      onChange={(e) => updateSubRecipeRow(idx, 'note', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-300/50"
                      placeholder="Note"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSubRecipeRow(idx)}
                    className="mt-1 rounded-lg p-1 text-red-400 transition-all hover:bg-red-50 hover:text-red-600"
                    title="Remove sub-recipe"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Images Section */}
        {!isNew && (
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#3e2723]">Images</h3>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#8b4513]/20 px-3 py-1.5 text-sm font-medium text-[#8b4513] transition-all hover:bg-[#faf3e8]">
                <ImagePlus size={14} />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files) return;
                    Array.from(files).forEach((file) => {
                      uploadImage.mutate(
                        { recipeId: id!, file },
                        {
                          onSuccess: () => toast.success(`Uploaded ${file.name}`),
                          onError: () => toast.error(`Failed to upload ${file.name}`),
                        },
                      );
                    });
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            {(!existingRecipe?.images || existingRecipe.images.length === 0) ? (
              <div className="mt-4 rounded-lg border-2 border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
                No images yet. Upload photos of the finished product or preparation steps.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {(existingRecipe.images as RecipeImage[]).map((img) => (
                  <div key={img.id} className="group relative overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={`/api/uploads/recipes/${img.filename}`}
                      alt={img.originalName}
                      className="aspect-square w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        deleteImage.mutate(
                          { recipeId: id!, imageId: img.id },
                          {
                            onSuccess: () => toast.success('Image deleted'),
                            onError: () => toast.error('Failed to delete image'),
                          },
                        );
                      }}
                      className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/70"
                      title="Delete image"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="truncate text-xs text-white">{img.originalName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {uploadImage.isPending && (
              <div className="mt-2 text-center text-xs text-gray-400">Uploading...</div>
            )}
          </div>
        )}

        {/* Storage Life Section */}
        <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#8b4513]" />
            <h3 className="text-base font-semibold text-[#3e2723]">
              Storage Life
            </h3>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DurationInput
              label="Room Temperature"
              value={storageLife.roomTempHours}
              onChange={(v) => setStorageLife((s) => ({ ...s, roomTempHours: v }))}
              placeholder="e.g. 24"
            />
            <DurationInput
              label="Refrigerated"
              value={storageLife.refrigeratedHours}
              onChange={(v) => setStorageLife((s) => ({ ...s, refrigeratedHours: v }))}
              placeholder="e.g. 72"
            />
            <DurationInput
              label="Frozen"
              value={storageLife.frozenHours}
              onChange={(v) => setStorageLife((s) => ({ ...s, frozenHours: v }))}
              placeholder="e.g. 720"
            />
            <DurationInput
              label="After Thawing"
              value={storageLife.thawedHours}
              onChange={(v) => setStorageLife((s) => ({ ...s, thawedHours: v }))}
              placeholder="e.g. 24"
            />
          </div>
        </div>

        {/* Links Section */}
        <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#3e2723]">Links</h3>
            <button
              type="button"
              onClick={addLinkRow}
              className="flex items-center gap-1.5 rounded-lg border border-[#8b4513]/20 px-3 py-1.5 text-sm font-medium text-[#8b4513] transition-all hover:bg-[#faf3e8]"
            >
              <Plus size={14} />
              Add Link
            </button>
          </div>

          {linkRows.length === 0 ? (
            <div className="mt-4 rounded-lg border-2 border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
              No links added yet. Click "Add Link" to add reference links or
              videos.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {linkRows.map((link, idx) => {
                const ytId = extractYouTubeId(link.url);
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-2 text-gray-400">
                        {ytId ? (
                          <Video size={16} className="text-red-500" />
                        ) : (
                          <LinkIcon size={16} />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) =>
                            updateLinkRow(idx, 'url', e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                          placeholder="https://..."
                        />
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) =>
                            updateLinkRow(idx, 'title', e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                          placeholder="Link title (optional)"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLinkRow(idx)}
                        className="mt-2 rounded-lg p-1 text-red-400 transition-all hover:bg-red-50 hover:text-red-600"
                        title="Remove link"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* YouTube Preview */}
                    {ytId && (
                      <div className="ml-6 overflow-hidden rounded-lg border border-gray-200">
                        <iframe
                          width="100%"
                          height="200"
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title={link.title || 'YouTube video'}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="block"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating save button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-[#8b4513] px-5 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </PageContainer>
  );
}
