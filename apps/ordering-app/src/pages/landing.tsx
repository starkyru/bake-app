import { useNavigate } from 'react-router';
import { MapPin, Phone, Clock, Truck, ShoppingBag } from 'lucide-react';
import { useOnlineLocations } from '@bake-app/react/api-client';
import { useTheme } from '../providers/theme-provider';

interface OnlineLocation {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  type: string;
  config?: {
    pickupEnabled?: boolean;
    deliveryEnabled?: boolean;
    dineInQrEnabled?: boolean;
  };
}

export function LandingPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useOnlineLocations();
  const { businessName, tagline, heroImageUrl } = useTheme();

  const locations = (data as OnlineLocation[] | undefined) ?? [];
  const location = locations[0];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: heroImageUrl ? `url(${heroImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <h1
            className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
            style={{ color: 'var(--color-primary)' }}
          >
            {businessName}
          </h1>
          <p
            className="mx-auto mt-4 max-w-lg text-lg"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {tagline}
          </p>
          <div className="mt-8">
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="rounded-full px-8 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              View Menu
            </button>
          </div>
        </div>
      </section>

      {/* About & Location */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-8 md:grid-cols-2">
          {/* About */}
          <div
            className="p-6"
            style={{
              backgroundColor: 'var(--color-card)',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <h2 className="mb-4 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              About Us
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {tagline || 'Freshly baked goods made with the finest ingredients.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span
                className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
              >
                <Clock className="h-4 w-4" /> Fresh daily
              </span>
              {location?.config?.deliveryEnabled && (
                <span
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
                >
                  <Truck className="h-4 w-4" /> Delivery available
                </span>
              )}
              {location?.config?.pickupEnabled && (
                <span
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
                >
                  <ShoppingBag className="h-4 w-4" /> Pickup ready
                </span>
              )}
            </div>
          </div>

          {/* Location / Contact */}
          <div
            className="p-6"
            style={{
              backgroundColor: 'var(--color-card)',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <h2 className="mb-4 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              Visit Us
            </h2>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div
                  className="h-6 w-6 animate-spin rounded-full border-4 border-t-transparent"
                  style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
                />
              </div>
            ) : location ? (
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                  {location.name}
                </h3>
                {location.address && (
                  <p
                    className="flex items-start gap-2 text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <MapPin
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: 'var(--color-primary)' }}
                    />
                    {location.address}
                  </p>
                )}
                {location.phone && (
                  <p
                    className="flex items-center gap-2 text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Phone
                      className="h-4 w-4 shrink-0"
                      style={{ color: 'var(--color-primary)' }}
                    />
                    {location.phone}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                No location information available.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
