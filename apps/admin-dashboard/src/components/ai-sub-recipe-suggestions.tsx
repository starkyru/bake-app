import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Link as LinkIcon, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Recipe } from '@bake-app/shared-types';
import { useSubRecipeSuggestions } from '@bake-app/react/api-client';

interface MatchedIngredient {
  ingredientName: string;
  quantity?: number;
  unit?: string;
  note?: string;
}

interface SubRecipeSuggestion {
  type: 'existing_match' | 'new_suggestion';
  existingRecipeId?: string;
  existingRecipeName?: string;
  suggestedName?: string;
  matchedIngredients: (string | MatchedIngredient)[];
  matchedSteps?: string;
  confidence: number;
  reason: string;
}

function getIngredientName(item: string | MatchedIngredient): string {
  return typeof item === 'string' ? item : item.ingredientName;
}

function getIngredientLabel(item: string | MatchedIngredient): string {
  if (typeof item === 'string') return item;
  const parts = [item.ingredientName];
  if (item.quantity) parts.push(`${item.quantity}${item.unit || 'g'}`);
  if (item.note) parts.push(`(${item.note})`);
  return parts.join(' ');
}

interface AiSubRecipeSuggestionsProps {
  aiRecipeData: any;
  existingRecipes: Recipe[];
  onLinkSubRecipe: (suggestion: {
    existingRecipeId: string;
    matchedIngredients: (string | MatchedIngredient)[];
  }) => void;
  onCreateSubRecipe: (suggestion: {
    suggestedName: string;
    matchedIngredients: (string | MatchedIngredient)[];
    matchedSteps?: string;
  }) => void;
  onDismiss: (index: number) => void;
}

export function AiSubRecipeSuggestions({
  aiRecipeData,
  existingRecipes,
  onLinkSubRecipe,
  onCreateSubRecipe,
  onDismiss,
}: AiSubRecipeSuggestionsProps) {
  const analyzeMutation = useSubRecipeSuggestions();
  const hasRun = useRef(false);
  const [suggestions, setSuggestions] = useState<SubRecipeSuggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [linked, setLinked] = useState<Set<number>>(new Set());
  const [hidden, setHidden] = useState(false);
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    analyzeMutation.mutate(aiRecipeData, {
      onSuccess: (data) => {
        const results: SubRecipeSuggestion[] = data?.suggestions ?? [];
        setSuggestions(results);
        if (results.length === 0) {
          autoDismissTimer.current = setTimeout(() => {
            setHidden(true);
          }, 3000);
        }
      },
      onError: () => {
        toast.error('Failed to analyze sub-recipe opportunities');
        setHidden(true);
      },
    });

    return () => {
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (hidden) return null;

  const visibleSuggestions = suggestions.filter(
    (_, i) => !dismissed.has(i) && !linked.has(i),
  );

  if (analyzeMutation.isIdle) return null;

  // Loading state
  if (analyzeMutation.isPending) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3">
        <Loader2 size={16} className="animate-spin text-purple-500" />
        <span className="text-sm text-purple-700">
          Analyzing recipe for sub-recipe opportunities...
        </span>
      </div>
    );
  }

  // No suggestions found
  if (analyzeMutation.isSuccess && suggestions.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-600">
        <CheckCircle2 size={16} />
        <span>No sub-recipe opportunities found</span>
      </div>
    );
  }

  // All dismissed/linked
  if (visibleSuggestions.length === 0) return null;

  const existingMatches = suggestions
    .map((s, i) => ({ ...s, originalIndex: i }))
    .filter(
      (s) =>
        s.type === 'existing_match' &&
        !dismissed.has(s.originalIndex) &&
        !linked.has(s.originalIndex),
    );

  const newSuggestionItems = suggestions
    .map((s, i) => ({ ...s, originalIndex: i }))
    .filter(
      (s) =>
        s.type === 'new_suggestion' &&
        !dismissed.has(s.originalIndex) &&
        !linked.has(s.originalIndex),
    );

  const handleDismiss = (originalIndex: number) => {
    setDismissed((prev) => new Set(prev).add(originalIndex));
    onDismiss(originalIndex);
  };

  const handleLink = (suggestion: SubRecipeSuggestion, originalIndex: number) => {
    if (!suggestion.existingRecipeId) return;
    setLinked((prev) => new Set(prev).add(originalIndex));
    onLinkSubRecipe({
      existingRecipeId: suggestion.existingRecipeId,
      matchedIngredients: suggestion.matchedIngredients,
    });
  };

  const confidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return { text: 'High', color: 'text-green-700 bg-green-100' };
    if (confidence >= 0.5) return { text: 'Medium', color: 'text-yellow-700 bg-yellow-100' };
    return { text: 'Low', color: 'text-gray-600 bg-gray-100' };
  };

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={16} className="text-purple-600" />
        <h4 className="text-sm font-semibold text-purple-800">
          AI Sub-Recipe Suggestions
        </h4>
      </div>

      {existingMatches.length > 0 && (
        <div className="mb-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-purple-500">
            Matching Existing Recipes
          </p>
          <div className="space-y-2">
            {existingMatches.map((s) => {
              const conf = confidenceLabel(s.confidence);
              return (
                <div
                  key={s.originalIndex}
                  className="flex items-start gap-3 rounded-md border border-purple-100 bg-white p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <LinkIcon size={14} className="shrink-0 text-purple-500" />
                      <span className="text-sm font-medium text-[#3e2723]">
                        {s.existingRecipeName}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${conf.color}`}
                      >
                        {conf.text}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{s.reason}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {s.matchedIngredients.map((item, mi) => (
                        <span
                          key={mi}
                          className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700"
                        >
                          {getIngredientLabel(item)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleLink(s, s.originalIndex)}
                      className="flex items-center gap-1 rounded-md bg-purple-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-700"
                    >
                      <ArrowRight size={12} />
                      Link as Sub-Recipe
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismiss(s.originalIndex)}
                      className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {newSuggestionItems.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-purple-500">
            Suggested New Sub-Recipes
          </p>
          <div className="space-y-2">
            {newSuggestionItems.map((s) => (
              <div
                key={s.originalIndex}
                className="flex items-start gap-3 rounded-md border border-purple-100 bg-white p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="shrink-0 text-purple-400" />
                    <span className="text-sm font-medium text-[#3e2723]">
                      {s.suggestedName}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{s.reason}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {s.matchedIngredients.map((item, mi) => (
                      <span
                        key={mi}
                        className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700"
                      >
                        {getIngredientLabel(item)}
                      </span>
                    ))}
                  </div>
                  {s.matchedSteps && (
                    <p className="mt-1 text-[11px] italic text-gray-400">
                      Steps: {s.matchedSteps}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLinked((prev) => new Set(prev).add(s.originalIndex));
                      onCreateSubRecipe({
                        suggestedName: s.suggestedName || 'New Sub-Recipe',
                        matchedIngredients: s.matchedIngredients,
                        matchedSteps: s.matchedSteps,
                      });
                    }}
                    className="flex items-center gap-1 rounded-md bg-purple-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    <ArrowRight size={12} />
                    Create Sub-Recipe
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismiss(s.originalIndex)}
                    className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    title="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
