import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  imageUrl?: string;
  dietaryTags?: string[];
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function ProductCard({
  id,
  name,
  price,
  category,
  description,
  imageUrl,
  dietaryTags,
}: ProductCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
      style={{
        backgroundColor: 'var(--color-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
      onClick={() => navigate(`/menu/${id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/menu/${id}`);
        }
      }}
    >
      {/* Image placeholder */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
            <span className="text-4xl opacity-40">🧁</span>
          </div>
        )}
        {dietaryTags && dietaryTags.length > 0 && (
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {dietaryTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide backdrop-blur-sm"
                style={{ color: 'var(--color-primary)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {category && (
          <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            {category}
          </p>
        )}
        <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>
          {name}
        </h3>
        {description && (
          <p
            className="mt-1 line-clamp-2 text-xs leading-relaxed"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {description}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
            {formatPrice(price)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/menu/${id}`);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
            aria-label={`Add ${name} to cart`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
