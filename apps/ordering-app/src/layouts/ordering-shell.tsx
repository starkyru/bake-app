import { Outlet, useNavigate, useLocation } from 'react-router';
import { Home, UtensilsCrossed, ShoppingBag, User, MapPin, Phone } from 'lucide-react';
import { CartIcon } from '../components/cart-icon';
import { useCustomerAuth } from '@bake-app/react/customer-auth';
import {
  useCustomerCartStore,
  selectCustomerTotalItems,
  useOrderingUIStore,
} from '@bake-app/react/store';
import { useOnlineLocationDetail } from '@bake-app/react/api-client';
import { useTheme } from '../providers/theme-provider';

export function OrderingShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer, isAuthenticated } = useCustomerAuth();
  const totalItems = useCustomerCartStore(selectCustomerTotalItems);
  const selectedLocationId = useOrderingUIStore((s) => s.selectedLocationId);
  const { data: locationDetailData } = useOnlineLocationDetail(selectedLocationId ?? '');
  const locationInfo = (locationDetailData as { location?: { name?: string; address?: string; phone?: string } } | undefined)?.location;
  const { businessName, logoUrl } = useTheme();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/menu', icon: UtensilsCrossed, label: 'Menu' },
    { path: '/cart', icon: ShoppingBag, label: 'Cart', badge: totalItems },
    { path: isAuthenticated ? '/account' : '/login', icon: User, label: 'Account' },
  ];

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Desktop header */}
      <header
        className="sticky top-0 z-40 border-b border-black/5"
        style={{ backgroundColor: 'var(--color-card)' }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Logo / business name */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-lg font-bold"
            style={{ color: 'var(--color-primary)' }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="text-2xl">🌷</span>
            )}
            <span className="hidden sm:inline">{businessName}</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{
                color:
                  location.pathname === '/'
                    ? 'var(--color-primary)'
                    : 'var(--color-text-muted)',
              }}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="text-sm font-medium transition-colors hover:opacity-80"
              style={{
                color: location.pathname.startsWith('/menu')
                  ? 'var(--color-primary)'
                  : 'var(--color-text-muted)',
              }}
            >
              Menu
            </button>
          </nav>

          {/* Right: cart + account */}
          <div className="flex items-center gap-2">
            <CartIcon onClick={() => navigate('/cart')} />
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate('/account')}
                className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
                aria-label="Account"
              >
                {customer?.firstName?.[0]?.toUpperCase() ?? 'U'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-white md:block"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        className="border-t border-black/5 pb-20 md:pb-0"
        style={{ backgroundColor: 'var(--color-card)' }}
      >
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {businessName}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                Freshly baked goods made with the finest ingredients. Order online for pickup or
                delivery.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Quick Links
              </h3>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => navigate('/menu')}
                  className="text-left text-xs hover:underline"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Browse Menu
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/account/orders')}
                  className="text-left text-xs hover:underline"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Order History
                </button>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Contact
              </h3>
              <div className="flex flex-col gap-1">
                <span
                  className="flex items-center gap-1.5 text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <MapPin className="h-3 w-3" /> {locationInfo?.address ?? 'Select a location to see address'}
                </span>
                {locationInfo?.phone && (
                  <span
                    className="flex items-center gap-1.5 text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Phone className="h-3 w-3" /> {locationInfo.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-black/5 pt-4 text-center">
            <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              &copy; {new Date().getFullYear()} {businessName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 md:hidden"
        style={{ backgroundColor: 'var(--color-card)' }}
      >
        <div className="flex items-center justify-around py-1">
          {navItems.map(({ path, icon: Icon, label, badge }) => {
            const isActive =
              path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(path);
            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className="relative flex flex-col items-center gap-0.5 px-3 py-2"
              >
                <div className="relative">
                  <Icon
                    className="h-5 w-5"
                    style={{
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}
                  />
                  {badge && badge > 0 ? (
                    <span
                      className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      {badge > 99 ? '99+' : badge}
                    </span>
                  ) : null}
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
