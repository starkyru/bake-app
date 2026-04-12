import { LogOut } from 'lucide-react';
import { NavLink } from 'react-router';
import { cn } from '../lib/utils';

export interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
  section?: string;
}

export interface SidebarProps {
  items: SidebarItem[];
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  collapsed?: boolean;
}

export function Sidebar({ items, onLogout, userName, userRole, collapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-[#8b4513]/10 bg-[#3e2723] transition-all duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center border-b border-white/10 py-4',
          collapsed ? 'justify-center px-2' : 'gap-2 px-4',
        )}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#8b4513] text-sm font-bold text-white">
          B
        </div>
        {!collapsed && <span className="text-lg font-bold text-white">Bake App</span>}
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 space-y-0.5 overflow-y-auto py-3', collapsed ? 'px-1.5' : 'px-2')}>
        {items.map((item, idx) => {
          const prevSection = idx > 0 ? items[idx - 1].section : undefined;
          const showSection = item.section && item.section !== prevSection;
          return (
            <div key={item.path}>
              {showSection && !collapsed && (
                <div className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40 first:mt-0">
                  {item.section}
                </div>
              )}
              {showSection && collapsed && <div className="my-2 border-t border-white/10" />}
              <NavLink
                to={item.path}
                end
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-lg text-sm font-medium',
                    'transition-all duration-150',
                    collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2',
                    isActive
                      ? 'bg-[#8b4513] text-white shadow-sm'
                      : 'text-white/70 hover:bg-white/10 hover:text-white',
                  )
                }
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs font-medium">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className={cn('border-t border-white/10', collapsed ? 'p-1.5' : 'p-3')}>
        {!collapsed && (userName || userRole) && (
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
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'flex w-full items-center rounded-lg text-sm font-medium',
            'text-white/70 transition-all duration-150 hover:bg-red-500/20 hover:text-red-300',
            collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2',
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
