import { useMemo, useState } from 'react';
import {
  Factory,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  X,
  Play,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useProductionPlans,
  useCreateProductionPlan,
  useUpdateTaskStatus,
  useProductionReport,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  StatsCard,
  DataTable,
  LoadingSpinner,
  StatusBadge,
  type TableColumn,
} from '@bake-app/react/ui';
import type { ProductionPlan, ProductionTask } from '@bake-app/shared-types';
import { ProductionTaskStatus } from '@bake-app/shared-types';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

const TASK_STATUS_FLOW: Record<string, string> = {
  [ProductionTaskStatus.PENDING]: ProductionTaskStatus.IN_PROGRESS,
  [ProductionTaskStatus.IN_PROGRESS]: ProductionTaskStatus.COMPLETED,
  [ProductionTaskStatus.DELAYED]: ProductionTaskStatus.IN_PROGRESS,
};

export function ProductionPage() {
  const [planDate, setPlanDate] = useState(formatDate(new Date()));
  const { data: plans, isLoading } = useProductionPlans({ date: planDate });
  const createPlan = useCreateProductionPlan();
  const updateTaskStatus = useUpdateTaskStatus();
  const { data: productionReport, isLoading: reportLoading } =
    useProductionReport({
      startDate: planDate,
      endDate: planDate,
    });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState({
    date: formatDate(new Date()),
    notes: '',
  });

  const planList: ProductionPlan[] = (plans as ProductionPlan[]) ?? [];
  const report = (productionReport as any) ?? {};

  // Aggregate all tasks across plans
  const allTasks = useMemo(() => {
    return planList.flatMap((plan) =>
      (plan.tasks ?? []).map((task) => ({
        ...task,
        planId: plan.id,
        planStatus: plan.status,
      })),
    );
  }, [planList]);

  const stats = useMemo(() => {
    const total = allTasks.length;
    const completed = allTasks.filter(
      (t) => t.status === ProductionTaskStatus.COMPLETED,
    ).length;
    const inProgress = allTasks.filter(
      (t) => t.status === ProductionTaskStatus.IN_PROGRESS,
    ).length;
    const delayed = allTasks.filter(
      (t) => t.status === ProductionTaskStatus.DELAYED,
    ).length;
    return { total, completed, inProgress, delayed };
  }, [allTasks]);

  const handleCreatePlan = () => {
    if (!createForm.date) {
      toast.error('Please select a date');
      return;
    }
    setSaving(true);
    createPlan.mutate(
      {
        date: new Date(createForm.date),
        notes: createForm.notes || undefined,
      } as any,
      {
        onSuccess: () => {
          toast.success('Production plan created');
          setShowCreateDialog(false);
          setCreateForm({ date: formatDate(new Date()), notes: '' });
          setSaving(false);
        },
        onError: () => {
          toast.error('Failed to create plan');
          setSaving(false);
        },
      },
    );
  };

  const handleAdvanceStatus = (task: ProductionTask) => {
    if (updateTaskStatus.isPending) return;
    const nextStatus = TASK_STATUS_FLOW[task.status];
    if (!nextStatus) {
      toast.error('Cannot advance this task further');
      return;
    }
    updateTaskStatus.mutate(
      { id: task.id, status: nextStatus },
      {
        onSuccess: () =>
          toast.success(
            `Task updated to ${nextStatus.replace(/_/g, ' ')}`,
          ),
        onError: () => toast.error('Failed to update task status'),
      },
    );
  };

  const taskColumns: TableColumn[] = [
    {
      key: 'recipeName',
      label: 'Recipe',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-[#3e2723]">
          {value ?? 'Unknown'}
        </span>
      ),
    },
    {
      key: 'plannedQuantity',
      label: 'Planned Qty',
      type: 'number',
      sortable: true,
    },
    {
      key: 'actualYield',
      label: 'Actual Yield',
      type: 'number',
      render: (value: number) => (
        <span className="font-mono text-sm">
          {value != null ? value.toLocaleString() : '\u2014'}
        </span>
      ),
    },
    {
      key: 'wasteQuantity',
      label: 'Waste',
      type: 'number',
      render: (value: number) => (
        <span
          className={`font-mono text-sm ${value > 0 ? 'text-red-600' : 'text-gray-400'}`}
        >
          {value ?? 0}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
    },
    {
      key: 'assigneeName',
      label: 'Assignee',
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value ?? '\u2014'}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      actions: [
        {
          action: 'advance',
          icon: <ChevronRight size={16} />,
          tooltip: 'Advance status',
          onClick: (row: any) => handleAdvanceStatus(row),
        },
      ],
    },
  ];

  // Ingredient requirements from report
  const ingredientRequirements = (report.ingredientRequirements ??
    report.ingredients ??
    []) as any[];

  return (
    <PageContainer
      title="Production"
      subtitle="Manage production plans and tasks"
      actions={
        <button
          type="button"
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-[#5d4037] active:scale-95"
        >
          <Plus size={16} />
          Create Plan
        </button>
      }
    >
      {/* Date Picker */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
        <span className="text-sm font-medium text-gray-600">Plan Date:</span>
        <input
          type="date"
          value={planDate}
          onChange={(e) => setPlanDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
        />
      </div>

      {isLoading && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#8b4513]/10">
          <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-[#8b4513]" />
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(400%); }
            }
          `}</style>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Tasks"
          value={stats.total}
          icon={<Factory size={20} />}
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircle2 size={20} />}
          color="success"
        />
        <StatsCard
          title="In Progress"
          value={stats.inProgress}
          icon={<Play size={20} />}
          color="warning"
        />
        <StatsCard
          title="Delayed"
          value={stats.delayed}
          icon={<AlertTriangle size={20} />}
          color="danger"
        />
      </div>

      {/* Plans Overview */}
      {planList.length > 0 && (
        <div className="space-y-2">
          {planList.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between rounded-xl border border-[#8b4513]/10 bg-white px-5 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Factory size={18} className="text-[#8b4513]" />
                <div>
                  <p className="text-sm font-medium text-[#3e2723]">
                    Plan:{' '}
                    {new Date(plan.date).toLocaleDateString()}
                  </p>
                  {plan.notes && (
                    <p className="text-xs text-gray-400">{plan.notes}</p>
                  )}
                </div>
              </div>
              <StatusBadge status={plan.status} size="sm" />
            </div>
          ))}
        </div>
      )}

      {/* Task Table */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-[#3e2723]">Tasks</h3>
        {isLoading ? (
          <LoadingSpinner message="Loading tasks..." />
        ) : allTasks.length === 0 ? (
          <div className="rounded-xl border border-[#8b4513]/10 bg-white py-12 text-center shadow-sm">
            <Clock size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">
              No production tasks for this date
            </p>
          </div>
        ) : (
          <DataTable
            columns={taskColumns}
            data={allTasks}
            searchable
            searchPlaceholder="Search tasks..."
            pageSize={10}
          />
        )}
      </div>

      {/* Ingredient Requirements */}
      <div className="rounded-xl border border-[#8b4513]/10 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-[#3e2723]">
          Ingredient Requirements
        </h3>
        {reportLoading ? (
          <LoadingSpinner message="Loading requirements..." />
        ) : ingredientRequirements.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No ingredient requirements for this date
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                    Ingredient
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                    Required
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                    Available
                  </th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {ingredientRequirements.map((req: any, idx: number) => {
                  const required = req.required ?? req.quantity ?? 0;
                  const available = req.available ?? req.inStock ?? 0;
                  const sufficient = available >= required;
                  return (
                    <tr
                      key={req.ingredientId ?? idx}
                      className="border-b border-gray-50"
                    >
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-700">
                        {req.ingredientName ?? req.name ?? 'Unknown'}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-sm">
                        {required.toLocaleString()} {req.unit ?? ''}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-sm">
                        {available.toLocaleString()} {req.unit ?? ''}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                            sufficient
                              ? 'border-green-200 bg-green-100 text-green-800'
                              : 'border-red-200 bg-red-100 text-red-800'
                          }`}
                        >
                          {sufficient ? 'Sufficient' : 'Insufficient'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Plan Dialog */}
      {showCreateDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowCreateDialog(false)}
        >
          <div
            className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowCreateDialog(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold text-[#3e2723]">
              Create Production Plan
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date *
                </label>
                <input
                  type="date"
                  value={createForm.date}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, date: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="Optional notes about this plan..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateDialog(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePlan}
                disabled={saving}
                className="rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
