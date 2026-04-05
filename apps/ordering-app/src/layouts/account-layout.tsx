import { Outlet, useNavigate, useLocation } from 'react-router';
import { User, MapPin, ClipboardList, Heart, Bell, LogOut } from 'lucide-react';
import { useCustomerAuth } from '@bake-app/react/customer-auth';

const accountNav = [
  { path: '/account', icon: User, label: 'Profile', exact: true },
  { path: '/account/addresses', icon: MapPin, label: 'Addresses' },
  { path: '/account/orders', icon: ClipboardList, label: 'Orders' },
  { path: '/account/favorites', icon: Heart, label: 'Favorites' },
  { path: '/account/notifications', icon: Bell, label: 'Notifications' },
];

export function AccountLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer, logout } = useCustomerAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Mobile top tabs */}
      <div className="mb-6 overflow-x-auto md:hidden">
        <div className="flex gap-2 pb-2">
          {accountNav.map(({ path, label, exact }) => {
            const isActive = exact
              ? location.pathname === path
              : location.pathname.startsWith(path);
            return (
              <button
                key={path}
                type="button"
                onClick={() => navigate(path)}
                className="shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-card)',
                  color: isActive ? 'white' : 'var(--color-text-muted)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div
            className="overflow-hidden p-4"
            style={{
              backgroundColor: 'var(--color-card)',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {/* User info */}
            <div className="mb-4 border-b border-black/5 pb-4">
              <div
                className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {customer?.firstName?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <p
                className="text-center text-sm font-semibold"
                style={{ color: 'var(--color-text)' }}
              >
                {customer?.firstName} {customer?.lastName}
              </p>
              <p
                className="text-center text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {customer?.email}
              </p>
            </div>

            {/* Nav items */}
            <nav className="flex flex-col gap-1">
              {accountNav.map(({ path, icon: Icon, label, exact }) => {
                const isActive = exact
                  ? location.pathname === path
                  : location.pathname.startsWith(path);
                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => navigate(path)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                      color: isActive ? 'white' : 'var(--color-text-muted)',
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
