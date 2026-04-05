import { useState, useEffect } from 'react';
import { Save, Globe } from 'lucide-react';
import { toast } from 'sonner';
import {
  useStorefrontConfig,
  useUpdateStorefrontConfig,
} from '@bake-app/react/api-client';
import { PageContainer, LoadingSpinner } from '@bake-app/react/ui';

const THEME_PRESETS = [
  {
    id: 'warm',
    label: 'Warm',
    description: 'Classic bakery browns and earthy tones',
    primary: '#8b4513',
    accent: '#d4a574',
    bg: 'bg-gradient-to-br from-[#8b4513] to-[#5d4037]',
  },
  {
    id: 'modern',
    label: 'Modern',
    description: 'Sleek dark blue and clean lines',
    primary: '#1e3a5f',
    accent: '#4a90d9',
    bg: 'bg-gradient-to-br from-[#1e3a5f] to-[#16213E]',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Black and white with sharp contrast',
    primary: '#1a1a1a',
    accent: '#666666',
    bg: 'bg-gradient-to-br from-[#1a1a1a] to-[#333333]',
  },
] as const;

interface ConfigForm {
  themePreset: string;
  businessName: string;
  tagline: string;
  logoUrl: string;
  heroImageUrl: string;
  primaryColor: string;
  accentColor: string;
  customDomain: string;
}

const defaultForm: ConfigForm = {
  themePreset: 'warm',
  businessName: '',
  tagline: '',
  logoUrl: '',
  heroImageUrl: '',
  primaryColor: '#8b4513',
  accentColor: '#d4a574',
  customDomain: '',
};

export function StorefrontSettingsPage() {
  const { data: config, isLoading } = useStorefrontConfig() as { data: any; isLoading: boolean };
  const updateConfig = useUpdateStorefrontConfig();
  const [form, setForm] = useState<ConfigForm>(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        themePreset: config.themePreset ?? 'warm',
        businessName: config.businessName ?? '',
        tagline: config.tagline ?? '',
        logoUrl: config.logoUrl ?? '',
        heroImageUrl: config.heroImageUrl ?? '',
        primaryColor: config.primaryColor ?? '#8b4513',
        accentColor: config.accentColor ?? '#d4a574',
        customDomain: config.customDomain ?? '',
      });
    }
  }, [config]);

  const handlePresetSelect = (preset: (typeof THEME_PRESETS)[number]) => {
    setForm((f) => ({
      ...f,
      themePreset: preset.id,
      primaryColor: preset.primary,
      accentColor: preset.accent,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig.mutateAsync(form as any);
      toast.success('Storefront settings saved');
    } catch {
      toast.error('Failed to save storefront settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title="Storefront Settings"
      subtitle="Customize your online storefront appearance"
      actions={
        <div className="flex items-center gap-2">
          <Globe size={20} className="text-[#8b4513]" />
        </div>
      }
    >
      {isLoading ? (
        <LoadingSpinner message="Loading storefront settings..." />
      ) : (
        <div className="space-y-6">
          {/* Theme Presets */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[#3e2723]">Theme Preset</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                    form.themePreset === preset.id
                      ? 'border-[#8b4513] shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`mb-3 h-16 w-full rounded-lg ${preset.bg}`} />
                  <p className="text-sm font-semibold text-[#3e2723]">{preset.label}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{preset.description}</p>
                  {form.themePreset === preset.id && (
                    <div className="absolute right-2 top-2 h-3 w-3 rounded-full bg-[#8b4513]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Business Info */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[#3e2723]">Business Info</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5d4037]">Business Name</label>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="Your Bakery Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5d4037]">Tagline</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="Fresh baked, daily"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[#3e2723]">Images</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5d4037]">Logo URL</label>
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5d4037]">Hero Image URL</label>
                <input
                  type="url"
                  value={form.heroImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, heroImageUrl: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="https://example.com/hero.jpg"
                />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[#3e2723]">Colors</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#5d4037]">Primary Color</label>
                <div className="mt-1 flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg border border-gray-200 shadow-sm"
                    style={{ backgroundColor: form.primaryColor }}
                  />
                  <input
                    type="text"
                    value={form.primaryColor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, primaryColor: e.target.value }))
                    }
                    className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                    placeholder="#8b4513"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#5d4037]">Accent Color</label>
                <div className="mt-1 flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg border border-gray-200 shadow-sm"
                    style={{ backgroundColor: form.accentColor }}
                  />
                  <input
                    type="text"
                    value={form.accentColor}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, accentColor: e.target.value }))
                    }
                    className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                    placeholder="#d4a574"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom Domain */}
          <div className="rounded-xl border border-[#8b4513]/10 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[#3e2723]">Custom Domain</h3>
            <div>
              <label className="block text-sm font-medium text-[#5d4037]">Domain</label>
              <input
                type="text"
                value={form.customDomain}
                onChange={(e) => setForm((f) => ({ ...f, customDomain: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#8b4513] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                placeholder="order.yourbakery.com"
              />
              <p className="mt-1.5 text-xs text-gray-400">
                Point a CNAME record to your storefront URL to use a custom domain.
              </p>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
