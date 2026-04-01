export interface PageContainerProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageContainer({
  title,
  subtitle,
  actions,
  children,
}: PageContainerProps) {
  return (
    <div className="flex-1 space-y-6 p-6">
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-2xl font-bold text-[#3e2723]">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
