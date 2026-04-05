import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Save,
  Image,
  User,
  Calendar,
  DollarSign,
  Palette,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useCustomOrderRequest,
  useUpdateCustomOrderRequest,
  useUsers,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  LoadingSpinner,
  EmptyState,
  StatusBadge,
  CurrencyDisplay,
} from '@bake-app/react/ui';

const STATUS_OPTIONS = [
  'pending',
  'quoted',
  'approved',
  'in_progress',
  'completed',
  'cancelled',
];

export function CustomOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: request, isLoading } = useCustomOrderRequest(id!) as { data: any; isLoading: boolean };
  const updateRequest = useUpdateCustomOrderRequest();
  const { data: staffUsers } = useUsers() as { data: any };

  const [quoteForm, setQuoteForm] = useState({
    quotedPrice: '',
    depositAmount: '',
    staffNotes: '',
    assignedToId: '',
    status: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (request) {
      setQuoteForm({
        quotedPrice: request.quotedPrice?.toString() ?? '',
        depositAmount: request.depositAmount?.toString() ?? '',
        staffNotes: request.staffNotes ?? '',
        assignedToId: request.assignedToId ?? '',
        status: request.status ?? 'pending',
      });
    }
  }, [request]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRequest.mutateAsync({
        id: id!,
        quotedPrice: quoteForm.quotedPrice ? parseFloat(quoteForm.quotedPrice) : undefined,
        depositAmount: quoteForm.depositAmount ? parseFloat(quoteForm.depositAmount) : undefined,
        staffNotes: quoteForm.staffNotes || undefined,
        assignedToId: quoteForm.assignedToId || undefined,
        status: quoteForm.status || undefined,
      });
      toast.success('Custom order updated');
    } catch {
      toast.error('Failed to update custom order');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner message="Loading custom order..." />
      </PageContainer>
    );
  }

  if (!request) {
    return (
      <PageContainer>
        <EmptyState
          title="Request not found"
          message="The requested custom order does not exist."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Custom Order Request"
      subtitle={`${request.occasion || 'Custom'} order for ${request.customer?.name || request.customerName || 'Guest'}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/custom-requests')}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Header */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
          <StatusBadge status={request.status} />
          <span className="text-sm text-gray-500">
            Created: {new Date(request.createdAt).toLocaleDateString()}
          </span>
          {request.requestedDate && (
            <span className="text-sm text-gray-500">
              <Calendar size={14} className="mr-1 inline" />
              Requested for: {new Date(request.requestedDate).toLocaleDateString()}
            </span>
          )}
          {request.quotedPrice != null && (
            <div className="flex items-center gap-1">
              <DollarSign size={14} className="text-[#8b4513]" />
              <CurrencyDisplay amount={request.quotedPrice} size="sm" />
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Request Details */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#3e2723]">
                <User size={16} />
                Customer
              </h3>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-[#3e2723]">
                  {request.customer?.name || request.customerName || 'Guest'}
                </p>
                {(request.customer?.email || request.customerEmail) && (
                  <p className="text-gray-500">
                    {request.customer?.email || request.customerEmail}
                  </p>
                )}
                {(request.customer?.phone || request.customerPhone) && (
                  <p className="text-gray-500">
                    {request.customer?.phone || request.customerPhone}
                  </p>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div className="rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#3e2723]">
                <Palette size={16} />
                Request Details
              </h3>
              <div className="space-y-3 text-sm">
                {request.occasion && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Occasion
                    </label>
                    <p className="mt-0.5 capitalize text-[#3e2723]">{request.occasion}</p>
                  </div>
                )}
                {request.servingSize && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Serving Size
                    </label>
                    <p className="mt-0.5 text-[#3e2723]">{request.servingSize}</p>
                  </div>
                )}
                {request.inscription && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Inscription
                    </label>
                    <p className="mt-0.5 text-[#3e2723] italic">"{request.inscription}"</p>
                  </div>
                )}
                {request.decorationNotes && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Decoration Notes
                    </label>
                    <p className="mt-0.5 text-[#3e2723]">{request.decorationNotes}</p>
                  </div>
                )}
                {request.themeColors && request.themeColors.length > 0 && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Theme Colors
                    </label>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {request.themeColors.map((color: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <div
                            className="h-5 w-5 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-gray-600">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {request.description && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      Description
                    </label>
                    <p className="mt-0.5 text-[#3e2723]">{request.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Reference Photos */}
            {request.referencePhotos && request.referencePhotos.length > 0 && (
              <div className="rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#3e2723]">
                  <Image size={16} />
                  Reference Photos
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {request.referencePhotos.map((url: string, idx: number) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-lg border border-gray-200"
                    >
                      <img
                        src={url}
                        alt={`Reference ${idx + 1}`}
                        className="h-32 w-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quote & Management */}
          <div className="space-y-6">
            {/* Status Update */}
            <div className="rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-[#3e2723]">Status</h3>
              <select
                value={quoteForm.status}
                onChange={(e) => setQuoteForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm capitalize focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Quote Form */}
            <div className="rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#3e2723]">
                <DollarSign size={16} />
                Quote
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Quoted Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quoteForm.quotedPrice}
                    onChange={(e) =>
                      setQuoteForm((f) => ({ ...f, quotedPrice: e.target.value }))
                    }
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Deposit Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quoteForm.depositAmount}
                    onChange={(e) =>
                      setQuoteForm((f) => ({ ...f, depositAmount: e.target.value }))
                    }
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  />
                </div>
              </div>
            </div>

            {/* Assign Staff */}
            <div className="rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-[#3e2723]">Assign to Staff</h3>
              <select
                value={quoteForm.assignedToId}
                onChange={(e) =>
                  setQuoteForm((f) => ({ ...f, assignedToId: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
              >
                <option value="">Unassigned</option>
                {(Array.isArray(staffUsers) ? staffUsers : staffUsers?.data ?? []).map(
                  (user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role?.toLowerCase().replace(/_/g, ' ')})
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Staff Notes */}
            <div className="rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#3e2723]">
                <MessageSquare size={16} />
                Staff Notes
              </h3>
              <textarea
                value={quoteForm.staffNotes}
                onChange={(e) =>
                  setQuoteForm((f) => ({ ...f, staffNotes: e.target.value }))
                }
                rows={4}
                placeholder="Internal notes about this request..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
              />
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
