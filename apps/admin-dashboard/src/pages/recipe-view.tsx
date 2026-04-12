import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Pencil,
  Printer,
  Monitor,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Link as LinkIcon,
  Video,
  Type,
} from 'lucide-react';
import { useRecipe, useRecipeCost } from '@bake-app/react/api-client';
import { PageContainer, LoadingSpinner } from '@bake-app/react/ui';
import { useWakeLock } from '../hooks/use-wake-lock';
import { useInstructionSteps } from '../hooks/use-instruction-steps';
import { CostEstimate } from '../components/cost-estimate';
import { YieldScaler } from '../components/yield-scaler';

const FONT_SIZES = [
  { label: 'S', class: 'text-sm', stepClass: 'text-base' },
  { label: 'M', class: 'text-base', stepClass: 'text-lg' },
  { label: 'L', class: 'text-lg', stepClass: 'text-xl' },
] as const;

export function RecipeViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: recipe, isLoading } = useRecipe(id!);
  const { data: recipeCost } = useRecipeCost(id!);
  const { isActive: wakeLockActive, isSupported: wakeLockSupported, toggle: toggleWakeLock } = useWakeLock();

  const [scaleFactor, setScaleFactor] = useState(1);
  const [viewMode, setViewMode] = useState<'all' | 'steps'>('all');
  const [currentStep, setCurrentStep] = useState(0);
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const printMenuRef = useRef<HTMLDivElement>(null);

  const steps = useInstructionSteps(recipe?.instructions);

  // Close print menu on outside click
  useEffect(() => {
    if (!printMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setPrintMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [printMenuOpen]);

  const handlePrint = (mode: 'full' | 'ingredients-only') => {
    setPrintMenuOpen(false);
    if (mode === 'ingredients-only') {
      document.body.classList.add('print-ingredients-only');
    }
    setTimeout(() => {
      window.print();
      document.body.classList.remove('print-ingredients-only');
    }, 100);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSpinner message="Loading recipe..." />
      </PageContainer>
    );
  }

  if (!recipe) {
    return (
      <PageContainer>
        <div className="text-center text-gray-500 py-12">Recipe not found.</div>
      </PageContainer>
    );
  }

  const fontConfig = FONT_SIZES[fontSize];

  return (
    <PageContainer
      title={recipe.name}
      subtitle={recipe.category ? recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1) : 'Recipe'}
      backPath="/recipes"
      actions={
        <div className="flex items-center gap-2" data-no-print>
          {wakeLockSupported && (
            <button
              type="button"
              onClick={toggleWakeLock}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                wakeLockActive
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              title={wakeLockActive ? 'Screen will stay on' : 'Keep screen on'}
            >
              <Monitor size={16} />
              {wakeLockActive ? 'Screen On' : 'Keep On'}
            </button>
          )}
          <div className="relative" ref={printMenuRef}>
            <button
              type="button"
              onClick={() => setPrintMenuOpen(!printMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              <Printer size={16} />
              Print
            </button>
            {printMenuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => handlePrint('full')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#faf3e8]"
                >
                  Full recipe
                </button>
                <button
                  type="button"
                  onClick={() => handlePrint('ingredients-only')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-[#faf3e8]"
                >
                  Ingredients only
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate(`/recipes/${id}`)}
            className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95"
          >
            <Pencil size={16} />
            Edit
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-[800px] space-y-6">
        {/* Yield & Multiplier */}
        <YieldScaler
          yieldQuantity={Number(recipe.yieldQuantity)}
          yieldUnit={recipe.yieldUnit}
          scaleFactor={scaleFactor}
          onScaleChange={setScaleFactor}
        />

        {/* Cost Estimate (replaces separate ingredients list) */}
        {recipeCost && (
          <CostEstimate
            recipeCost={recipeCost}
            scaleFactor={scaleFactor}
            title="Ingredients & Cost"
          />
        )}

        {/* Instructions */}
        {steps.length > 0 && (
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm" data-print-section="instructions">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-[#3e2723]">Instructions</h3>
              <div className="flex items-center gap-2" data-no-print>
                {/* Font size toggle */}
                <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-0.5">
                  <Type size={12} className="ml-1 text-gray-400" />
                  {FONT_SIZES.map((fs, i) => (
                    <button
                      key={fs.label}
                      type="button"
                      onClick={() => setFontSize(i)}
                      className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
                        fontSize === i
                          ? 'bg-[#8b4513] text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>
                {/* View mode toggle */}
                <div className="flex rounded-lg border border-gray-200 p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('all')}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                      viewMode === 'all'
                        ? 'bg-[#8b4513] text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    All Steps
                  </button>
                  <button
                    type="button"
                    onClick={() => { setViewMode('steps'); setCurrentStep(0); }}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                      viewMode === 'steps'
                        ? 'bg-[#8b4513] text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Step by Step
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4">
              {viewMode === 'all' ? (
                <div className="space-y-4">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8b4513]/10 text-xs font-semibold text-[#8b4513]">
                        {idx + 1}
                      </span>
                      <p className={`${fontConfig.class} leading-relaxed text-[#3e2723]`}>{step}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="mb-2 text-center text-xs font-medium text-gray-400">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                  <div className="min-h-[100px] rounded-lg bg-[#faf3e8]/50 p-6">
                    <div className="flex gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8b4513] text-sm font-bold text-white">
                        {currentStep + 1}
                      </span>
                      <p className={`${fontConfig.stepClass} leading-relaxed text-[#3e2723]`}>{steps[currentStep]}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2" data-no-print>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(0)}
                      disabled={currentStep === 0}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="First step"
                    >
                      <ChevronsLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                      disabled={currentStep === 0}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Previous step"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
                      disabled={currentStep === steps.length - 1}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Next step"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(steps.length - 1)}
                      disabled={currentStep === steps.length - 1}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Last step"
                    >
                      <ChevronsRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Links */}
        {recipe.links && recipe.links.length > 0 && (
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm print:hidden">
            <h3 className="text-base font-semibold text-[#3e2723]">Links</h3>
            <div className="mt-4 space-y-4">
              {recipe.links.map((link, idx) => {
                const ytId = link.isYoutube ? link.youtubeVideoId : null;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2">
                      {ytId ? (
                        <Video size={16} className="text-red-500" />
                      ) : (
                        <LinkIcon size={16} className="text-gray-400" />
                      )}
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {link.title || link.url}
                      </a>
                    </div>
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
          </div>
        )}
      </div>
    </PageContainer>
  );
}
