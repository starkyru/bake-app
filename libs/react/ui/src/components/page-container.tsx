import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

export interface PageContainerProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backPath?: string;
  children: React.ReactNode;
}

export function PageContainer({
  title,
  subtitle,
  actions,
  backPath,
  children,
}: PageContainerProps) {
  return (
    <div className="flex-1 space-y-6 p-6">
      {(title || actions || backPath) && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {backPath && (
              <Link
                to={backPath}
                className="flex items-center justify-center rounded-lg p-1.5 text-[#5d4037] transition-colors hover:bg-[#faf3e8]"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            <div>
              {title && (
                <h1 className="text-2xl font-bold text-[#3e2723]">{title}</h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
