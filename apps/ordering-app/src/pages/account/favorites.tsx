import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Heart, ShoppingBag, X } from 'lucide-react';
import { useCustomerCartStore, type CustomerCartProduct } from '@bake-app/react/store';
import { toast } from 'sonner';

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string;
}

/**
 * Favorites are stored locally for now. In a full implementation,
 * they would be stored on the server via a customer favorites API.
 */
const FAVORITES_KEY = 'customer-favorites';

function getFavorites(): FavoriteProduct[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setFavoritesStorage(favs: FavoriteProduct[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

export function FavoritesPage() {
  const navigate = useNavigate();
  const addItem = useCustomerCartStore((s) => s.addItem);
  const [favorites, setFavorites] = useState<FavoriteProduct[]>(getFavorites);

  const handleRemove = (id: string) => {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    setFavoritesStorage(updated);
    toast.success('Removed from favorites');
  };

  const handleAddToCart = (product: FavoriteProduct) => {
    const cartProduct: CustomerCartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
    };
    addItem(cartProduct);
    toast.success(`${product.name} added to cart`);
  };

  if (favorites.length === 0) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Favorites
        </h2>
        <div className="py-12 text-center">
          <Heart className="mx-auto h-12 w-12 opacity-20" />
          <p className="mt-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            You haven&apos;t saved any favorites yet.
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Browse the menu and save your favorite items for quick access.
          </p>
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="mt-4 rounded-full px-6 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        Favorites
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {favorites.map((product) => (
          <div
            key={product.id}
            className="relative overflow-hidden"
            style={{
              backgroundColor: 'var(--color-card)',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {/* Remove button */}
            <button
              type="button"
              onClick={() => handleRemove(product.id)}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-red-400 backdrop-blur-sm transition-colors hover:text-red-600"
              aria-label={`Remove ${product.name} from favorites`}
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Image */}
            <div className="aspect-square bg-gray-100">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
                  <span className="text-3xl opacity-30">🧁</span>
                </div>
              )}
            </div>

            <div className="p-3">
              <h3
                className="text-sm font-semibold leading-snug"
                style={{ color: 'var(--color-text)' }}
              >
                {product.name}
              </h3>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {formatPrice(product.price)}
                </span>
                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  className="flex h-8 items-center gap-1 rounded-full px-3 text-xs font-medium text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  <ShoppingBag className="h-3 w-3" /> Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
