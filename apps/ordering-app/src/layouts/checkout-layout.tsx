import { Outlet, useNavigate } from 'react-router';
import { ArrowLeft, Lock } from 'lucide-react';
import { useTheme } from '../providers/theme-provider';

export function CheckoutLayout() {
  const navigate = useNavigate();
  const { businessName, logoUrl } = useTheme();

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Minimal header */}
      <header
        className="sticky top-0 z-40 border-b border-black/5"
        style={{ backgroundColor: 'var(--color-card)' }}
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: 'var(--color-text)' }} />
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-bold"
            style={{ color: 'var(--color-primary)' }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <span className="text-lg">🌷</span>
            )}
            {businessName}
          </button>

          <div className="flex h-10 w-10 items-center justify-center">
            <Lock className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
