import { Menu, LogOut, User } from 'lucide-react';
import { cn } from '../lib/utils';

export interface HeaderProps {
  title?: string;
  onMobileMenuClick?: () => void;
  userName?: string;
  onLogout?: () => void;
}

export function Header({ title, onMobileMenuClick, userName, onLogout }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[#8b4513]/10 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-3">
        {onMobileMenuClick && (
          <button
            type="button"
            onClick={onMobileMenuClick}
            className="rounded-lg p-1.5 text-[#5d4037] transition-colors hover:bg-[#faf3e8] md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {title && (
          <h1 className="text-lg font-semibold text-[#3e2723]">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {userName && (
          <div className="flex items-center gap-2 text-sm text-[#5d4037]">
            <User className="h-4 w-4" />
            <span>{userName}</span>
          </div>
        )}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[#5d4037]',
              'transition-all duration-150 hover:bg-red-50 hover:text-red-600',
            )}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
