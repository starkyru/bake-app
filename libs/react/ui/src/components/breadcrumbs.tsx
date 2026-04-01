import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="mx-1.5 h-3.5 w-3.5 text-gray-400" />
            )}
            {item.path && !isLast ? (
              <Link
                to={item.path}
                className="text-[#8b4513] transition-colors hover:text-[#5d4037] hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-[#3e2723]">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
