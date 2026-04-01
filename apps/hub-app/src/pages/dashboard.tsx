import { useAuth } from '@bake-app/react/auth';
import { UserRole } from '@bake-app/shared-types';
import { Monitor, Settings, ChefHat, ArrowRight, Ban } from 'lucide-react';
import { env } from '../env';
import type { LucideIcon } from 'lucide-react';

interface AppLink {
  name: string;
  description: string;
  icon: LucideIcon;
  url: string;
  color: string;
}

const POS_APP: AppLink = {
  name: 'POS',
  description: 'Point of Sale terminal',
  icon: Monitor,
  url: env.posUrl,
  color: '#4caf50',
};

const ADMIN_APP: AppLink = {
  name: 'Admin',
  description: 'Administration panel',
  icon: Settings,
  url: env.adminUrl,
  color: '#2196f3',
};

const KITCHEN_APP: AppLink = {
  name: 'Kitchen',
  description: 'Kitchen display system',
  icon: ChefHat,
  url: env.kitchenUrl,
  color: '#ff9800',
};

const ROLE_APP_MAP: Record<string, AppLink[]> = {
  [UserRole.OWNER]: [POS_APP, ADMIN_APP, KITCHEN_APP],
  [UserRole.MANAGER]: [POS_APP, ADMIN_APP, KITCHEN_APP],
  [UserRole.ACCOUNTANT]: [ADMIN_APP],
  [UserRole.CHEF]: [KITCHEN_APP],
  [UserRole.BAKER]: [KITCHEN_APP],
  [UserRole.BARISTA]: [POS_APP, KITCHEN_APP],
  [UserRole.CASHIER]: [POS_APP, KITCHEN_APP],
  [UserRole.WAREHOUSE]: [ADMIN_APP],
  [UserRole.MARKETING]: [ADMIN_APP],
};

export function DashboardPage() {
  const { user, logout } = useAuth();

  const userName = user?.name || user?.email || 'User';
  const userRole = user?.role || '';
  const apps = ROLE_APP_MAP[userRole] || [];

  return (
    <div className="max-w-[900px] mx-auto px-6 py-10">
      {/* Welcome section */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#3e2723] mb-2">Welcome, {userName}</h1>
          <p className="text-[15px] text-[#6d4c41] m-0">
            Role:{' '}
            <span className="inline-block bg-[#8b4513] text-white px-2.5 py-0.5 rounded-xl text-xs font-semibold tracking-wide uppercase">
              {userRole}
            </span>
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-[#8d6e63] hover:text-[#5d4037] bg-transparent border
            border-[#d7ccc8] rounded-lg px-4 py-2 cursor-pointer hover:border-[#8d6e63]
            transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* App cards grid */}
      {apps.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5">
          {apps.map((app) => (
            <a
              key={app.name}
              href={app.url}
              className="group flex flex-col items-center p-8 bg-white rounded-xl
                shadow-[0_2px_12px_rgba(0,0,0,0.06)] no-underline text-inherit
                transition-all duration-200 relative cursor-pointer
                hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(139,69,19,0.15)]"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: app.color + '20' }}
              >
                <app.icon size={32} style={{ color: app.color }} />
              </div>
              <h3 className="text-lg font-semibold text-[#3e2723] mb-1">{app.name}</h3>
              <p className="text-[13px] text-[#8d6e63] text-center m-0">{app.description}</p>
              <ArrowRight
                size={20}
                className="absolute top-4 right-4 text-[#bdbdbd] transition-colors
                  group-hover:text-[#8b4513]"
              />
            </a>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[#8d6e63]">
          <Ban size={48} className="mx-auto mb-4 text-[#d7ccc8]" />
          <p>No applications available for your role.</p>
        </div>
      )}
    </div>
  );
}
