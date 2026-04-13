import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MapPin, Phone, Clock, Truck, ShoppingBag, Store } from 'lucide-react';
import { useOnlineLocations } from '@bake-app/react/api-client';
import { useOrderingUIStore } from '@bake-app/react/store';
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
  const setSelectedLocationId = useOrderingUIStore((s) => s.setSelectedLocationId);
  const { businessName, tagline, heroImageUrl } = useTheme();

  const locations = (data as OnlineLocation[] | undefined) ?? [];

  // Auto-select if there's only one location
  useEffect(() => {
    if (!isLoading && locations.length === 1) {
      setSelectedLocationId(locations[0].id);
      navigate('/menu', { replace: true });
    }
  }, [isLoading, locations, setSelectedLocationId, navigate]);

  const handleSelectLocation = (locationId: string) => {
    setSelectedLocationId(locationId);
    navigate('/menu');
  };

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
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
            <span
              className="flex items-center gap-1.5 rounded-full px-4 py-2"
              style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text-muted)' }}
            >
              <Clock className="h-4 w-4" /> Fresh daily
            </span>
            <span
              className="flex items-center gap-1.5 rounded-full px-4 py-2"
              style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text-muted)' }}
            >
              <Truck className="h-4 w-4" /> Delivery available
            </span>
            <span
              className="flex items-center gap-1.5 rounded-full px-4 py-2"
              style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-text-muted)' }}
            >
              <ShoppingBag className="h-4 w-4" /> Pickup ready
            </span>
          </div>
        </div>
      </section>

      {/* Location selection */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2
          className="mb-6 text-center text-2xl font-bold"
          style={{ color: 'var(--color-text)' }}
        >
          Select a Location
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div
              className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
              style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : locations.length === 0 ? (
          <div className="py-12 text-center">
            <Store className="mx-auto h-12 w-12 opacity-30" />
            <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No locations are currently available for online ordering.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelectLocation(loc.id)}
                className="group p-5 text-left transition-all hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--color-card)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <h3
                  className="text-lg font-semibold transition-colors"
                  style={{ color: 'var(--color-text)' }}
                >
                  {loc.name}
                </h3>
                {loc.address && (
                  <p
                    className="mt-1 flex items-start gap-1.5 text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {loc.address}
                  </p>
                )}
                {loc.phone && (
                  <p
                    className="mt-1 flex items-center gap-1.5 text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    {loc.phone}
                  </p>
                )}

                {/* Fulfillment badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {loc.config?.pickupEnabled && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      <ShoppingBag className="h-3 w-3" /> Pickup
                    </span>
                  )}
                  {loc.config?.deliveryEnabled && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      <Truck className="h-3 w-3" /> Delivery
                    </span>
                  )}
                  {loc.config?.dineInQrEnabled && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      <Store className="h-3 w-3" /> Dine-in
                    </span>
                  )}
                </div>

                <div
                  className="mt-4 text-sm font-medium transition-colors group-hover:underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Order from here &rarr;
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
