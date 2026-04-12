import { Outlet, useNavigate } from 'react-router';
import { useAuth } from '@bake-app/react/auth';
import { useUIStore } from '@bake-app/react/store';
import { Sidebar, Header } from '@bake-app/react/ui';
import type { SidebarItem } from '@bake-app/react/ui';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Tag,
  BookOpenCheck,
  Package,
  Factory,
  DollarSign,
  TrendingUp,
  Settings,
  X,
  ShoppingBag,
  Cake,
  Globe,
  Settings2,
} from 'lucide-react';

const sidebarItems: SidebarItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, path: '/dashboard' },
  { label: 'Users', icon: <Users className="h-4 w-4" />, path: '/users' },
  { label: 'Menus', icon: <BookOpen className="h-4 w-4" />, path: '/menu' },
  { label: 'Products', icon: <Tag className="h-4 w-4" />, path: '/products' },
  { label: 'Recipes', icon: <BookOpenCheck className="h-4 w-4" />, path: '/recipes' },
  { label: 'Inventory', icon: <Package className="h-4 w-4" />, path: '/inventory' },
  { label: 'Production', icon: <Factory className="h-4 w-4" />, path: '/production' },
  { label: 'Finance', icon: <DollarSign className="h-4 w-4" />, path: '/finance' },
  { label: 'Sales', icon: <TrendingUp className="h-4 w-4" />, path: '/sales' },
  { label: 'Settings', icon: <Settings className="h-4 w-4" />, path: '/settings' },
  { label: 'Online Orders', icon: <ShoppingBag className="h-4 w-4" />, path: '/online-orders', section: 'Online Ordering' },
  { label: 'Custom Requests', icon: <Cake className="h-4 w-4" />, path: '/custom-requests', section: 'Online Ordering' },
  { label: 'Customers', icon: <Users className="h-4 w-4" />, path: '/customers', section: 'Online Ordering' },
  { label: 'Online Config', icon: <Settings2 className="h-4 w-4" />, path: '/online-config', section: 'Online Ordering' },
  { label: 'Storefront', icon: <Globe className="h-4 w-4" />, path: '/storefront', section: 'Online Ordering' },
];

export function AdminShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf3e8]">
      {/* Desktop sidebar — always visible, collapses to icons */}
      <div className="hidden md:flex">
        <Sidebar
          items={sidebarItems}
          onLogout={handleLogout}
          userName={user?.name}
          userRole={user?.role}
          collapsed={!sidebarOpen}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative h-full w-64">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar
              items={sidebarItems}
              onLogout={handleLogout}
              userName={user?.name}
              userRole={user?.role}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onMenuClick={toggleSidebar}
          userName={user?.name}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
