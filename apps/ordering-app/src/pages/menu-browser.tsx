import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react';
import { useOnlineMenus, useOnlineLocationDetail } from '@bake-app/react/api-client';
import { useOrderingUIStore } from '@bake-app/react/store';
import { ProductCard } from '../components/product-card';

interface MenuProduct {
  id: string;
  name: string;
  price: number;
  description?: string;
  categoryId?: string;
  category?: { id: string; name: string };
}

interface StandaloneMenu {
  menu: { id: string; name: string; description?: string };
  products: MenuProduct[];
  config?: {
    prepTimeMinutes?: number;
    leadTimeHours?: number;
    requiresApproval?: boolean;
    preorderEnabled?: boolean;
  } | null;
}

interface MenusResponse {
  merged: {
    products: MenuProduct[];
    byCategory?: { category: string; products: MenuProduct[] }[];
  };
  standalone: StandaloneMenu[];
}

interface FlatProduct {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  categoryId: string;
}

const DIETARY_FILTERS = ['Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Sugar-Free'];

export function MenuBrowserPage() {
  const navigate = useNavigate();
  const selectedLocationId = useOrderingUIStore((s) => s.selectedLocationId);
  const searchQuery = useOrderingUIStore((s) => s.menuSearchQuery);
  const setSearchQuery = useOrderingUIStore((s) => s.setMenuSearchQuery);
  const dietaryFilters = useOrderingUIStore((s) => s.activeDietaryFilters);
  const setDietaryFilters = useOrderingUIStore((s) => s.setDietaryFilters);

  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const { data: locationData } = useOnlineLocationDetail(selectedLocationId ?? '');
  const { data: menuData, isLoading } = useOnlineMenus(selectedLocationId ?? '');

  const locationDetail = locationData as
    | { location?: { name?: string; address?: string; phone?: string }; config?: unknown }
    | undefined;
  const menusResponse = menuData as MenusResponse | undefined;

  // Map API response into flat products
  const { mergedProducts, standaloneMenus, allCategories } = useMemo(() => {
    const categorySet = new Set<string>();

    const toFlat = (p: MenuProduct): FlatProduct => {
      const cat = p.category?.name ?? 'Other';
      categorySet.add(cat);
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        description: p.description,
        category: cat,
        categoryId: p.categoryId ?? '',
      };
    };

    const merged = (menusResponse?.merged?.products ?? []).map(toFlat);

    const standalone = (menusResponse?.standalone ?? []).map((s) => ({
      menu: s.menu,
      products: s.products.map(toFlat),
    }));

    return {
      mergedProducts: merged,
      standaloneMenus: standalone,
      allCategories: Array.from(categorySet).sort(),
    };
  }, [menusResponse]);

  // Filter products
  const filterProducts = (products: FlatProduct[]) => {
    let filtered = products;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }

    if (activeCategory) {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }

    // Dietary filters are placeholder; a real implementation would match product tags
    // For now they narrow results if set (no actual tag data exists yet)

    return filtered;
  };

  const filteredMerged = filterProducts(mergedProducts);

  // Group by category
  const groupedMerged = useMemo(() => {
    const groups: Record<string, FlatProduct[]> = {};
    for (const p of filteredMerged) {
      (groups[p.category] ??= []).push(p);
    }
    return groups;
  }, [filteredMerged]);

  // Redirect if no location selected
  if (!selectedLocationId) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>
          Please select a location first
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 rounded-full px-6 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Choose Location
        </button>
      </div>
    );
  }

  const toggleDietary = (filter: string) => {
    if (dietaryFilters.includes(filter)) {
      setDietaryFilters(dietaryFilters.filter((f) => f !== filter));
    } else {
      setDietaryFilters([...dietaryFilters, filter]);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Location header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {locationDetail?.location?.name ?? 'Selected Location'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-xs font-medium hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          Change
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full border border-black/10 pl-10 pr-4 text-sm outline-none focus:ring-2"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-card)',
              color: 'var(--color-text)',
              '--tw-ring-color': 'var(--color-primary)',
            } as React.CSSProperties}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex h-11 w-11 items-center justify-center border border-black/10"
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: showFilters ? 'var(--color-primary)' : 'var(--color-card)',
            color: showFilters ? 'white' : 'var(--color-text-muted)',
          }}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Dietary filters */}
      {showFilters && (
        <div
          className="mb-4 flex flex-wrap gap-2 p-3"
          style={{
            backgroundColor: 'var(--color-card)',
            borderRadius: 'var(--radius)',
            border: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <span className="mr-1 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Dietary:
          </span>
          {DIETARY_FILTERS.map((filter) => {
            const active = dietaryFilters.includes(filter);
            return (
              <button
                key={filter}
                type="button"
                onClick={() => toggleDietary(filter)}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: active ? 'white' : 'var(--color-text-muted)',
                }}
              >
                {filter}
              </button>
            );
          })}
        </div>
      )}

      {/* Category chips */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className="shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors"
          style={{
            backgroundColor: !activeCategory ? 'var(--color-primary)' : 'var(--color-card)',
            color: !activeCategory ? 'white' : 'var(--color-text-muted)',
          }}
        >
          All
        </button>
        {allCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            className="shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeCategory === cat ? 'var(--color-primary)' : 'var(--color-card)',
              color: activeCategory === cat ? 'white' : 'var(--color-text-muted)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <>
          {/* Standalone menu tabs */}
          {standaloneMenus.length > 0 && (
            <div className="mb-6">
              <div className="mb-3 flex gap-2 overflow-x-auto border-b border-black/5 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab(null)}
                  className="shrink-0 px-4 py-2 text-sm font-medium transition-colors"
                  style={{
                    color: !activeTab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderBottom: !activeTab ? '2px solid var(--color-primary)' : '2px solid transparent',
                  }}
                >
                  All Items
                </button>
                {standaloneMenus.map(({ menu }) => (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => setActiveTab(menu.id === activeTab ? null : menu.id)}
                    className="shrink-0 px-4 py-2 text-sm font-medium transition-colors"
                    style={{
                      color:
                        activeTab === menu.id
                          ? 'var(--color-primary)'
                          : 'var(--color-text-muted)',
                      borderBottom:
                        activeTab === menu.id
                          ? '2px solid var(--color-primary)'
                          : '2px solid transparent',
                    }}
                  >
                    {menu.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product grid - merged */}
          {(!activeTab || activeTab === null) && (
            <>
              {Object.keys(groupedMerged).length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {searchQuery ? 'No products match your search.' : 'No products available.'}
                  </p>
                </div>
              ) : (
                Object.entries(groupedMerged).map(([category, products]) => (
                  <div key={category} className="mb-8">
                    <h2
                      className="mb-4 text-lg font-bold"
                      style={{ color: 'var(--color-text)' }}
                    >
                      {category}
                    </h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                      {products.map((p) => (
                        <ProductCard
                          key={p.id}
                          id={p.id}
                          name={p.name}
                          price={p.price}
                          category={p.category}
                          description={p.description}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Standalone menu products */}
          {activeTab &&
            standaloneMenus
              .filter(({ menu }) => menu.id === activeTab)
              .map(({ menu, products: menuProducts }) => {
                const filtered = filterProducts(menuProducts);
                const grouped: Record<string, FlatProduct[]> = {};
                for (const p of filtered) {
                  (grouped[p.category] ??= []).push(p);
                }
                return (
                  <div key={menu.id}>
                    {menu.description && (
                      <p
                        className="mb-4 text-sm"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {menu.description}
                      </p>
                    )}
                    {Object.entries(grouped).map(([category, products]) => (
                      <div key={category} className="mb-8">
                        <h2
                          className="mb-4 text-lg font-bold"
                          style={{ color: 'var(--color-text)' }}
                        >
                          {category}
                        </h2>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                          {products.map((p) => (
                            <ProductCard
                              key={p.id}
                              id={p.id}
                              name={p.name}
                              price={p.price}
                              category={p.category}
                              description={p.description}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
        </>
      )}
    </div>
  );
}
