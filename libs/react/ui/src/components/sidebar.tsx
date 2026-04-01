import { LogOut } from 'lucide-react';
import { NavLink } from 'react-router';
import { cn } from '../lib/utils';

export interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

export interface SidebarProps {
  items: SidebarItem[];
  onLogout: () => void;
  userName?: string;
  userRole?: string;
}

export function Sidebar({ items, onLogout, userName, userRole }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-[#8b4513]/10 bg-[#3e2723]">
      {/* Brand */}
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8b4513] text-sm font-bold text-white">
          B
        </div>
        <span className="text-lg font-bold text-white">Bake App</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                'transition-all duration-150',
                isActive
                  ? 'bg-[#8b4513] text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-medium">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User & Logout */}
      <div className="border-t border-white/10 p-3">
        {(userName || userRole) && (
          <div className="mb-2 px-3">
            {userName && (
              <p className="text-sm font-medium text-white truncate">
                {userName}
              </p>
            )}
            {userRole && (
              <p className="text-xs text-white/50 capitalize">
                {userRole.toLowerCase().replace(/_/g, ' ')}
              </p>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={onLogout}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
            'text-white/70 transition-all duration-150 hover:bg-red-500/20 hover:text-red-300',
          )}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
