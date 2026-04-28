import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import {
  useProductionPlans,
  useUpdateTaskStatus,
  useExpiringBatches,
} from '@bake-app/react/api-client';
import type { ProductionTask, ProductionBatch } from '@bake-app/shared-types';
import {
  ArrowLeft,
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Hourglass,
} from 'lucide-react';

const STATUS_ORDER = ['pending', 'in_progress', 'completed', 'delayed'] as const;

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Clock; color: string; bg: string }
> = {
  pending: {
    label: 'Scheduled',
    icon: Hourglass,
    color: 'text-[#4FC3F7]',
    bg: 'bg-[#4FC3F7]/10',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircle,
    color: 'text-[#FFB74D]',
    bg: 'bg-[#FFB74D]/10',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-[#81C784]',
    bg: 'bg-[#81C784]/10',
  },
  delayed: {
    label: 'Delayed',
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
  },
};

export function ProductionPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  const { data: plans, isLoading } = useProductionPlans({ date: today });
  const updateTask = useUpdateTaskStatus();
  const { data: expiringBatchesData } = useExpiringBatches(24, undefined, {
    refetchInterval: 300000,
  });
  const expiringBatches: ProductionBatch[] =
    (expiringBatchesData as ProductionBatch[]) ?? [];

  // Flatten all tasks from all plans
  const allTasks = useMemo(() => {
    if (!plans) return [];
    const planList = Array.isArray(plans) ? plans : [];
    return planList.flatMap((plan) =>
      (plan.tasks || []).map((task: ProductionTask) => ({
        ...task,
        planDate: plan.date,
        planStatus: plan.status,
      })),
    );
  }, [plans]);

  // Group tasks by status
  const grouped = useMemo(() => {
    const map: Record<string, typeof allTasks> = {};
    for (const s of STATUS_ORDER) {
      map[s] = [];
    }
    for (const task of allTasks) {
      const key = STATUS_ORDER.includes(task.status as (typeof STATUS_ORDER)[number])
        ? task.status
        : 'pending';
      map[key].push(task);
    }
    return map;
  }, [allTasks]);

  function handleStatusChange(taskId: string, newStatus: string) {
    updateTask.mutate(
      { id: taskId, status: newStatus },
      {
        onSuccess: () => toast.success(`Task updated to ${newStatus}`),
        onError: () => toast.error('Failed to update task'),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0D1B2A]">
        <p className="text-gray-400">Loading production plans...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/queue')}
              className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Queue
            </button>
            <h1 className="text-2xl font-bold text-white">
              Production Tasks
            </h1>
          </div>
          <span className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-gray-400">
            {today}
          </span>
        </div>

        {allTasks.length === 0 && (
          <div className="flex h-64 items-center justify-center rounded-xl bg-[#16213E] text-gray-500">
            No production tasks for today
          </div>
        )}

        {/* Expiry Warning Banner */}
        {expiringBatches.length > 0 && (
          <div className="mb-6 rounded-xl bg-[#16213E] p-4">
            <div className="mb-3 flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-sm font-bold uppercase tracking-wider">
                Expiring Batches
              </h2>
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/10 text-xs font-bold text-amber-400">
                {expiringBatches.length}
              </span>
            </div>
            <div className="space-y-2">
              {expiringBatches.map((batch) => {
                const now = new Date();
                const expiry = batch.expiryDate
                  ? new Date(batch.expiryDate)
                  : null;
                const diff = expiry ? expiry.getTime() - now.getTime() : 0;
                const isExpired = diff <= 0;
                const hoursLeft = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
                const minsLeft = Math.max(
                  0,
                  Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                );

                const borderColor = isExpired
                  ? 'border-red-500'
                  : 'border-amber-500';
                const textColor = isExpired
                  ? 'text-red-400'
                  : 'text-amber-400';

                return (
                  <div
                    key={batch.id}
                    className={`flex items-center justify-between rounded-lg border ${borderColor} bg-[#0D1B2A] px-4 py-2.5`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-white">
                        {batch.recipeName}
                      </span>
                      <span className="font-mono text-xs text-gray-400">
                        #{batch.batchNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-sm text-gray-300">
                        {batch.remainingQuantity} {batch.unit}
                      </span>
                      <span className={`text-xs font-semibold ${textColor}`}>
                        {isExpired
                          ? 'EXPIRED'
                          : hoursLeft > 0
                            ? `${hoursLeft}h ${minsLeft}m left`
                            : `${minsLeft}m left`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Task groups */}
        {STATUS_ORDER.map((status) => {
          const tasks = grouped[status];
          if (!tasks || tasks.length === 0) return null;
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;

          return (
            <div key={status} className="mb-6">
              <div className={`mb-3 flex items-center gap-2 ${config.color}`}>
                <Icon className="h-5 w-5" />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {config.label}
                </h2>
                <span
                  className={`ml-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${config.bg} ${config.color}`}
                >
                  {tasks.length}
                </span>
              </div>

              <div className="overflow-hidden rounded-xl bg-[#16213E]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <th className="px-5 py-3">Recipe</th>
                      <th className="px-5 py-3 text-center">Planned Qty</th>
                      <th className="px-5 py-3 text-center">Actual Yield</th>
                      <th className="px-5 py-3 text-center">Waste</th>
                      <th className="px-5 py-3">Progress</th>
                      <th className="px-5 py-3">Assignee</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const yieldPct =
                        task.plannedQuantity > 0 && task.actualYield
                          ? Math.round(
                              (task.actualYield / task.plannedQuantity) * 100,
                            )
                          : 0;

                      return (
                        <tr
                          key={task.id}
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="px-5 py-4 font-medium text-white">
                            {task.recipeName ?? 'Recipe'}
                          </td>
                          <td className="px-5 py-4 text-center font-mono text-gray-300">
                            {task.plannedQuantity}
                          </td>
                          <td className="px-5 py-4 text-center font-mono text-gray-300">
                            {task.actualYield ?? '-'}
                          </td>
                          <td className="px-5 py-4 text-center font-mono text-gray-300">
                            {task.wasteQuantity > 0 ? (
                              <span className="text-red-400">
                                {task.wasteQuantity}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(yieldPct, 100)}%`,
                                    background:
                                      'linear-gradient(90deg, #FFB74D, #FF9800)',
                                  }}
                                />
                              </div>
                              <span className="w-10 text-right text-xs text-gray-500">
                                {yieldPct}%
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-400">
                            {task.assigneeName ?? '-'}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {task.status === 'pending' && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      task.id,
                                      'in_progress',
                                    )
                                  }
                                  className="rounded-lg bg-[#FFB74D]/20 px-3 py-1.5 text-xs font-semibold text-[#FFB74D] hover:bg-[#FFB74D]/30"
                                >
                                  Start
                                </button>
                              )}
                              {task.status === 'in_progress' && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      task.id,
                                      'completed',
                                    )
                                  }
                                  className="rounded-lg bg-[#81C784]/20 px-3 py-1.5 text-xs font-semibold text-[#81C784] hover:bg-[#81C784]/30"
                                >
                                  Complete
                                </button>
                              )}
                              {task.status === 'delayed' && (
                                <button
                                  onClick={() =>
                                    handleStatusChange(
                                      task.id,
                                      'in_progress',
                                    )
                                  }
                                  className="rounded-lg bg-[#FFB74D]/20 px-3 py-1.5 text-xs font-semibold text-[#FFB74D] hover:bg-[#FFB74D]/30"
                                >
                                  Resume
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
