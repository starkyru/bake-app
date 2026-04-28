import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  useUpdateTaskStatus,
  useRecipe,
  useBatchesForRecipe,
  batchKeys,
} from '@bake-app/react/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '@bake-app/react/ui';
import type { ProductionTask, ProductionBatch } from '@bake-app/shared-types';

interface TaskCompletionModalProps {
  task: ProductionTask;
  open: boolean;
  onClose: () => void;
  locationId?: string;
}

const STORAGE_CONDITIONS = [
  { value: 'room_temp', label: 'Room Temp' },
  { value: 'refrigerated', label: 'Refrigerated' },
  { value: 'frozen', label: 'Frozen' },
];

function SubRecipeBatchSelector({
  subRecipeId,
  subRecipeName,
  quantity,
  unit,
  locationId,
  selectedBatchId,
  onSelect,
}: {
  subRecipeId: string;
  subRecipeName: string;
  quantity: number;
  unit: string;
  locationId?: string;
  selectedBatchId: string;
  onSelect: (batchId: string) => void;
}) {
  const { data: batches, isLoading } = useBatchesForRecipe(
    subRecipeId,
    locationId,
  );
  const batchList: ProductionBatch[] = (batches as ProductionBatch[]) ?? [];

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-[#3e2723]">
          {subRecipeName}
        </span>
        <span className="font-mono text-xs text-gray-500">
          {quantity} {unit} needed
        </span>
      </div>
      {isLoading ? (
        <p className="text-xs text-gray-400">Loading batches...</p>
      ) : batchList.length === 0 ? (
        <p className="text-xs text-red-500">No available batches</p>
      ) : (
        <select
          value={selectedBatchId}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
        >
          {batchList.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.batchNumber} - {batch.remainingQuantity} {batch.unit}{' '}
              remaining
              {batch.expiryDate
                ? ` (exp: ${new Date(batch.expiryDate).toLocaleDateString()})`
                : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export function TaskCompletionModal({
  task,
  open,
  onClose,
  locationId,
}: TaskCompletionModalProps) {
  const queryClient = useQueryClient();
  const updateTaskStatus = useUpdateTaskStatus();
  const { data: recipe } = useRecipe(task.recipeId, true);

  const [actualYield, setActualYield] = useState<number>(
    task.plannedQuantity ?? 0,
  );
  const [wasteQuantity, setWasteQuantity] = useState<number>(0);
  const [storageCondition, setStorageCondition] = useState('room_temp');
  const [batchSelections, setBatchSelections] = useState<
    Record<string, string>
  >({});

  const subRecipes = useMemo(() => {
    if (!recipe?.subRecipes || recipe.subRecipes.length === 0) return [];
    return recipe.subRecipes.map((sr) => ({
      subRecipeId: sr.subRecipeId,
      subRecipeName: sr.subRecipe?.name ?? 'Sub-recipe',
      quantity: sr.quantity,
      unit: sr.unit,
    }));
  }, [recipe]);

  const handleBatchSelect = (subRecipeId: string, batchId: string) => {
    setBatchSelections((prev) => ({ ...prev, [subRecipeId]: batchId }));
  };

  const handleSubmit = () => {
    if (updateTaskStatus.isPending) return;

    const batchConsumptions = subRecipes
      .filter((sr) => batchSelections[sr.subRecipeId])
      .map((sr) => ({
        batchId: batchSelections[sr.subRecipeId],
        quantity: sr.quantity,
      }));

    updateTaskStatus.mutate(
      {
        id: task.id,
        status: 'completed',
        actualYield,
        wasteQuantity,
        storageCondition,
        locationId,
        batchConsumptions:
          batchConsumptions.length > 0 ? batchConsumptions : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Task completed and batch created');
          queryClient.invalidateQueries({ queryKey: batchKeys.all });
          onClose();
        },
        onError: () => toast.error('Failed to complete task'),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Complete Task: ${task.recipeName ?? 'Recipe'}`}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={updateTaskStatus.isPending}
            className="rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
          >
            {updateTaskStatus.isPending
              ? 'Completing...'
              : 'Complete & Create Batch'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Actual Yield */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Actual Yield
          </label>
          <input
            type="number"
            min={0}
            step="any"
            value={actualYield}
            onChange={(e) => setActualYield(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
          />
          <p className="mt-1 text-xs text-gray-400">
            Planned: {task.plannedQuantity}
          </p>
        </div>

        {/* Waste Quantity */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Waste Quantity
          </label>
          <input
            type="number"
            min={0}
            step="any"
            value={wasteQuantity}
            onChange={(e) => setWasteQuantity(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
          />
        </div>

        {/* Storage Condition */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Storage Condition
          </label>
          <select
            value={storageCondition}
            onChange={(e) => setStorageCondition(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
          >
            {STORAGE_CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sub-recipe Batch Consumption */}
        {subRecipes.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#3e2723]">
              Batch Consumption
            </h3>
            <p className="mb-3 text-xs text-gray-500">
              Select which batch to consume for each sub-recipe (FIFO - oldest
              first is pre-selected).
            </p>
            <div className="space-y-3">
              {subRecipes.map((sr) => (
                <SubRecipeBatchSelector
                  key={sr.subRecipeId}
                  subRecipeId={sr.subRecipeId}
                  subRecipeName={sr.subRecipeName}
                  quantity={sr.quantity}
                  unit={sr.unit}
                  locationId={locationId}
                  selectedBatchId={batchSelections[sr.subRecipeId] ?? ''}
                  onSelect={(batchId) =>
                    handleBatchSelect(sr.subRecipeId, batchId)
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
