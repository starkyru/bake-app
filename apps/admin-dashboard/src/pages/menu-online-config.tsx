import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Plus, Trash2, Save, ArrowLeft, X, Tag } from 'lucide-react';
import { toast } from 'sonner';
import {
  useMenuConfig,
  useUpdateMenuConfig,
  useMenuSchedules,
  useCreateMenuSchedule,
  useDeleteMenuSchedule,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  LoadingSpinner,
  useConfirmation,
} from '@bake-app/react/ui';

interface ConfigForm {
  mergeWithOthers: boolean;
  standalone: boolean;
  preorderEnabled: boolean;
  preorderDaysAhead: number;
  requiresApproval: boolean;
  prepTimeMinutes: number;
  leadTimeHours: number;
}

const defaultConfig: ConfigForm = {
  mergeWithOthers: false,
  standalone: true,
  preorderEnabled: false,
  preorderDaysAhead: 7,
  requiresApproval: false,
  prepTimeMinutes: 30,
  leadTimeHours: 2,
};

interface ScheduleForm {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const emptySchedule: ScheduleForm = {
  dayOfWeek: 0,
  startTime: '09:00',
  endTime: '17:00',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function MenuOnlineConfigPage() {
  const { menuId } = useParams<{ menuId: string }>();
  const navigate = useNavigate();
  const { data: config, isLoading: configLoading } = useMenuConfig(menuId!) as { data: any; isLoading: boolean };
  const updateConfig = useUpdateMenuConfig();
  const { data: schedules, isLoading: schedulesLoading } = useMenuSchedules(menuId!) as { data: any[]; isLoading: boolean };
  const createSchedule = useCreateMenuSchedule();
  const deleteSchedule = useDeleteMenuSchedule();
  const { confirm, ConfirmationDialog } = useConfirmation();

  const [form, setForm] = useState<ConfigForm>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>(emptySchedule);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (config) {
      setForm({
        mergeWithOthers: config.mergeWithOthers ?? false,
        standalone: config.standalone ?? true,
        preorderEnabled: config.preorderEnabled ?? false,
        preorderDaysAhead: config.preorderDaysAhead ?? 7,
        requiresApproval: config.requiresApproval ?? false,
        prepTimeMinutes: config.prepTimeMinutes ?? 30,
        leadTimeHours: config.leadTimeHours ?? 2,
      });
    }
  }, [config]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await updateConfig.mutateAsync({ menuId: menuId!, ...form });
      toast.success('Menu config saved');
    } catch {
      toast.error('Failed to save menu config');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSchedule.mutateAsync({
        menuId: menuId!,
        ...scheduleForm,
      });
      toast.success('Schedule added');
      setShowScheduleForm(false);
      setScheduleForm(emptySchedule);
    } catch {
      toast.error('Failed to add schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    const confirmed = await confirm(
      'Delete Schedule',
      'Are you sure you want to delete this schedule entry?',
      { variant: 'danger', confirmText: 'Delete' },
    );
    if (!confirmed) return;
    try {
      await deleteSchedule.mutateAsync({ menuId: menuId!, scheduleId });
      toast.success('Schedule deleted');
    } catch {
      toast.error('Failed to delete schedule');
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    const currentTags: string[] = (config as any)?.tags ?? [];
    if (currentTags.includes(tag)) {
      toast.error('Tag already exists');
      return;
    }
    updateConfig
      .mutateAsync({ menuId: menuId!, tags: [...currentTags, tag] })
      .then(() => {
        toast.success('Tag added');
        setTagInput('');
      })
      .catch(() => toast.error('Failed to add tag'));
  };

  const handleRemoveTag = async (tag: string) => {
    const currentTags: string[] = (config as any)?.tags ?? [];
    try {
      await updateConfig.mutateAsync({
        menuId: menuId!,
        tags: currentTags.filter((t) => t !== tag),
      });
      toast.success('Tag removed');
    } catch {
      toast.error('Failed to remove tag');
    }
  };

  const isLoading = configLoading || schedulesLoading;

  return (
    <PageContainer
      title="Menu Online Config"
      subtitle="Configure online ordering settings for this menu"
      actions={
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      }
    >
      {isLoading ? (
        <LoadingSpinner message="Loading menu config..." />
      ) : (
        <div className="space-y-6">
          {/* Config Form */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[#3e2723]">General Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.mergeWithOthers}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, mergeWithOthers: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#8b4513] accent-[#8b4513]"
                />
                <span className="text-sm font-medium text-[#3e2723]">
                  Merge with other menus
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.standalone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, standalone: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#8b4513] accent-[#8b4513]"
                />
                <span className="text-sm font-medium text-[#3e2723]">Standalone menu</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.preorderEnabled}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, preorderEnabled: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#8b4513] accent-[#8b4513]"
                />
                <span className="text-sm font-medium text-[#3e2723]">Enable preorders</span>
              </label>

              {form.preorderEnabled && (
                <div className="ml-7">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Preorder Days Ahead
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={form.preorderDaysAhead}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        preorderDaysAhead: parseInt(e.target.value) || 7,
                      }))
                    }
                    className="w-32 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  />
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiresApproval}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, requiresApproval: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#8b4513] accent-[#8b4513]"
                />
                <span className="text-sm font-medium text-[#3e2723]">
                  Requires approval for orders
                </span>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#5d4037]">
                    Prep Time (minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.prepTimeMinutes}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        prepTimeMinutes: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#5d4037]">
                    Lead Time (hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.leadTimeHours}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        leadTimeHours: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Config'}
                </button>
              </div>
            </div>
          </div>

          {/* Schedules */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#3e2723]">Schedules</h3>
              <button
                type="button"
                onClick={() => setShowScheduleForm(true)}
                className="flex items-center gap-1.5 rounded-lg bg-[#8b4513] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95"
              >
                <Plus size={14} />
                Add Schedule
              </button>
            </div>

            {(schedules ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                No schedules configured
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#faf3e8]/50">
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                        Day
                      </th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                        Start
                      </th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#5d4037]">
                        End
                      </th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#5d4037] w-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(schedules ?? []).map((schedule: any) => (
                      <tr key={schedule.id} className="border-b border-gray-50">
                        <td className="px-4 py-2.5 text-sm font-medium text-[#3e2723]">
                          {DAY_NAMES[schedule.dayOfWeek] ?? schedule.dayOfWeek}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-sm text-gray-600">
                          {schedule.startTime}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-sm text-gray-600">
                          {schedule.endTime}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="rounded-lg p-1.5 text-red-400 transition-all hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#3e2723]">
              <Tag size={16} />
              Tags
            </h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {((config as any)?.tags ?? []).length === 0 ? (
                <p className="text-sm text-gray-400">No tags</p>
              ) : (
                ((config as any)?.tags ?? []).map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-[#8b4513]/20 bg-[#faf3e8] px-3 py-1 text-xs font-medium text-[#5d4037]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-0.5 rounded-full p-0.5 text-[#8b4513]/50 transition-colors hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {ConfirmationDialog}

      {/* Add Schedule Dialog */}
      {showScheduleForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowScheduleForm(false)}
        >
          <div
            className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowScheduleForm(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={16} />
            </button>
            <h2 className="text-lg font-semibold text-[#3e2723]">Add Schedule</h2>
            <form onSubmit={handleAddSchedule} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5d4037]">Day of Week *</label>
                <select
                  value={scheduleForm.dayOfWeek}
                  onChange={(e) =>
                    setScheduleForm((f) => ({
                      ...f,
                      dayOfWeek: parseInt(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                >
                  {DAY_NAMES.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.startTime}
                    onChange={(e) =>
                      setScheduleForm((f) => ({ ...f, startTime: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5d4037]">End Time *</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.endTime}
                    onChange={(e) =>
                      setScheduleForm((f) => ({ ...f, endTime: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSchedule.isPending}
                  className="rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
                >
                  {createSchedule.isPending ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
