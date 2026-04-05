import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Check, Cake, Palette, Image, ClipboardList } from 'lucide-react';
import { useOnlineLocations, useCreateCustomOrderRequest } from '@bake-app/react/api-client';
import { useCustomerAuth } from '@bake-app/react/customer-auth';
import { toast } from 'sonner';

const STEPS = ['Occasion', 'Details', 'Decoration', 'Review'] as const;
const STEP_ICONS = [Cake, ClipboardList, Palette, Check];
const OCCASIONS = [
  'Birthday',
  'Wedding',
  'Anniversary',
  'Baby Shower',
  'Graduation',
  'Corporate Event',
  'Holiday',
  'Other',
];
const SERVING_SIZES = [
  '6-8 servings',
  '10-12 servings',
  '15-20 servings',
  '25-30 servings',
  '40-50 servings',
  '60+ servings',
];

interface OnlineLocation {
  id: string;
  name: string;
}

export function CustomCakeRequestPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerAuth();
  const { data: locationsData } = useOnlineLocations();
  const createRequest = useCreateCustomOrderRequest();

  const locations = (locationsData as OnlineLocation[] | undefined) ?? [];

  const [step, setStep] = useState(0);
  const [locationId, setLocationId] = useState('');
  const [occasion, setOccasion] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [inscriptionText, setInscriptionText] = useState('');
  const [decorationNotes, setDecorationNotes] = useState('');
  const [themeColors, setThemeColors] = useState('');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');

  const canProceed = (): boolean => {
    if (step === 0) return !!locationId && !!occasion && !!servingSize;
    if (step === 1) return true; // All fields optional
    if (step === 2) return true;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to submit a custom order request');
      navigate('/login');
      return;
    }

    try {
      await createRequest.mutateAsync({
        locationId,
        occasion,
        servingSize,
        requestedDate: preferredDate || undefined,
        inscriptionText: inscriptionText || undefined,
        decorationNotes: decorationNotes || undefined,
        themeColors: themeColors || undefined,
        referenceImageUrls: referenceImageUrl ? [referenceImageUrl] : [],
      });
      toast.success('Custom order request submitted! We will contact you soon.');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit request');
    }
  };

  const inputStyle = {
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--color-card)',
    color: 'var(--color-text)',
    '--tw-ring-color': 'var(--color-primary)',
  } as React.CSSProperties;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm font-medium hover:underline"
        style={{ color: 'var(--color-primary)' }}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="mb-2 text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
        Custom Cake Request
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Tell us about your dream cake and we&apos;ll make it happen.
      </p>

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-1">
        {STEPS.map((label, i) => {
          const Icon = STEP_ICONS[i];
          const isActive = i === step;
          const isCompleted = i < step;
          return (
            <div key={label} className="flex items-center">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                  style={{
                    backgroundColor: isActive || isCompleted ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: isActive || isCompleted ? 'white' : 'var(--color-text-muted)',
                  }}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                >
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className="mx-1 h-0.5 w-6 md:w-10"
                  style={{ backgroundColor: i < step ? 'var(--color-primary)' : 'rgba(0,0,0,0.1)' }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Occasion */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Location
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
              style={inputStyle}
            >
              <option value="">Select a location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Occasion
            </label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {OCCASIONS.map((occ) => (
                <button
                  key={occ}
                  type="button"
                  onClick={() => setOccasion(occ)}
                  className="py-2.5 text-center text-sm font-medium transition-colors"
                  style={{
                    borderRadius: 'var(--radius)',
                    backgroundColor: occasion === occ ? 'var(--color-primary)' : 'var(--color-card)',
                    color: occasion === occ ? 'white' : 'var(--color-text)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Serving Size
            </label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {SERVING_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setServingSize(size)}
                  className="py-2.5 text-center text-sm font-medium transition-colors"
                  style={{
                    borderRadius: 'var(--radius)',
                    backgroundColor: servingSize === size ? 'var(--color-primary)' : 'var(--color-card)',
                    color: servingSize === size ? 'white' : 'var(--color-text)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Preferred Date
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Inscription Text
            </label>
            <input
              type="text"
              value={inscriptionText}
              onChange={(e) => setInscriptionText(e.target.value)}
              placeholder='e.g., "Happy Birthday Sarah!"'
              maxLength={100}
              className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Decoration Notes
            </label>
            <textarea
              value={decorationNotes}
              onChange={(e) => setDecorationNotes(e.target.value)}
              placeholder="Describe the decoration you'd like (e.g., flowers, fondant figures, sprinkles)..."
              rows={4}
              className="w-full border border-black/10 p-3 text-sm outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Theme / Colors
            </label>
            <input
              type="text"
              value={themeColors}
              onChange={(e) => setThemeColors(e.target.value)}
              placeholder="e.g., Pink and gold, Unicorn theme, Rustic"
              className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
        </div>
      )}

      {/* Step 3: Reference image */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Reference Image URL (optional)
            </label>
            <input
              type="url"
              value={referenceImageUrl}
              onChange={(e) => setReferenceImageUrl(e.target.value)}
              placeholder="https://example.com/cake-inspiration.jpg"
              className="h-11 w-full border border-black/10 px-3 text-sm outline-none focus:ring-2"
              style={inputStyle}
            />
            {referenceImageUrl && (
              <div className="mt-3 overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                <img
                  src={referenceImageUrl}
                  alt="Reference"
                  className="h-48 w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            {!referenceImageUrl && (
              <div
                className="mt-3 flex h-32 flex-col items-center justify-center border-2 border-dashed border-gray-200"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <Image className="h-8 w-8 opacity-30" />
                <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Paste an image URL above for inspiration
                </p>
              </div>
            )}
          </div>

          {/* Review preview */}
          <div
            className="mt-4 p-4"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Request Summary
            </h3>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt style={{ color: 'var(--color-text-muted)' }}>Location</dt>
                <dd style={{ color: 'var(--color-text)' }}>
                  {locations.find((l) => l.id === locationId)?.name ?? '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: 'var(--color-text-muted)' }}>Occasion</dt>
                <dd style={{ color: 'var(--color-text)' }}>{occasion || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: 'var(--color-text-muted)' }}>Serving Size</dt>
                <dd style={{ color: 'var(--color-text)' }}>{servingSize || '-'}</dd>
              </div>
              {preferredDate && (
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--color-text-muted)' }}>Preferred Date</dt>
                  <dd style={{ color: 'var(--color-text)' }}>
                    {new Date(preferredDate + 'T12:00:00').toLocaleDateString()}
                  </dd>
                </div>
              )}
              {inscriptionText && (
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--color-text-muted)' }}>Inscription</dt>
                  <dd className="text-right" style={{ color: 'var(--color-text)' }}>
                    &ldquo;{inscriptionText}&rdquo;
                  </dd>
                </div>
              )}
              {themeColors && (
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--color-text-muted)' }}>Theme / Colors</dt>
                  <dd style={{ color: 'var(--color-text)' }}>{themeColors}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {/* Step 4: Final review + submit */}
      {step === 3 && (
        <div>
          <div
            className="p-4"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-card)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Final Review
            </h3>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt style={{ color: 'var(--color-text-muted)' }}>Location</dt>
                <dd className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {locations.find((l) => l.id === locationId)?.name ?? '-'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: 'var(--color-text-muted)' }}>Occasion</dt>
                <dd style={{ color: 'var(--color-text)' }}>{occasion}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: 'var(--color-text-muted)' }}>Serving Size</dt>
                <dd style={{ color: 'var(--color-text)' }}>{servingSize}</dd>
              </div>
              {preferredDate && (
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--color-text-muted)' }}>Preferred Date</dt>
                  <dd style={{ color: 'var(--color-text)' }}>
                    {new Date(preferredDate + 'T12:00:00').toLocaleDateString()}
                  </dd>
                </div>
              )}
              {inscriptionText && (
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--color-text-muted)' }}>Inscription</dt>
                  <dd style={{ color: 'var(--color-text)' }}>&ldquo;{inscriptionText}&rdquo;</dd>
                </div>
              )}
              {decorationNotes && (
                <div>
                  <dt className="mb-1" style={{ color: 'var(--color-text-muted)' }}>
                    Decoration Notes
                  </dt>
                  <dd className="text-sm" style={{ color: 'var(--color-text)' }}>
                    {decorationNotes}
                  </dd>
                </div>
              )}
              {themeColors && (
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--color-text-muted)' }}>Theme / Colors</dt>
                  <dd style={{ color: 'var(--color-text)' }}>{themeColors}</dd>
                </div>
              )}
            </dl>
          </div>

          <p className="mt-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            After submitting, our team will review your request and contact you with a quote and
            timeline. A deposit may be required.
          </p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 py-3 text-sm font-medium transition-colors"
            style={{
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(0,0,0,0.1)',
              backgroundColor: 'var(--color-card)',
              color: 'var(--color-text)',
            }}
          >
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-primary)',
            }}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createRequest.isPending}
            className="flex-1 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-primary)',
            }}
          >
            {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        )}
      </div>
    </div>
  );
}
