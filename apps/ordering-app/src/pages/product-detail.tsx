import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useOnlineMenus } from '@bake-app/react/api-client';
import {
  useCustomerCartStore,
  useOrderingUIStore,
  type SelectedOption,
  type CustomerCartProduct,
} from '@bake-app/react/store';
import { QuantityControl } from '../components/quantity-control';
import { toast } from 'sonner';

interface ProductOptionData {
  id: string;
  groupId: string;
  name: string;
  priceModifier: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface ProductOptionGroupData {
  id: string;
  productId: string;
  name: string;
  type: string; // 'single' | 'multiple'
  isRequired: boolean;
  sortOrder: number;
  maxSelections?: number;
  options: ProductOptionData[];
}

interface MenuProductData {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    price: number;
    description?: string;
    category?: { id: string; name: string };
    optionGroups?: ProductOptionGroupData[];
  };
}

interface MenuData {
  id: string;
  name: string;
  menuProducts?: MenuProductData[];
}

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const locationId = useOrderingUIStore((s) => s.selectedLocationId);
  const addItem = useCustomerCartStore((s) => s.addItem);

  const { data: menuData, isLoading } = useOnlineMenus(locationId ?? '');
  const menus = (menuData as MenuData[] | undefined) ?? [];

  // Find the product across all menus
  const product = useMemo(() => {
    for (const menu of menus) {
      const mp = menu.menuProducts?.find((mp) => mp.product?.id === productId);
      if (mp?.product) return mp.product;
    }
    return null;
  }, [menus, productId]);

  const optionGroups = product?.optionGroups ?? [];

  // Initialize selections with defaults
  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const defaults: Record<string, string[]> = {};
    for (const group of optionGroups) {
      const defaultOpts = group.options
        .filter((o) => o.isDefault && o.isActive)
        .map((o) => o.id);
      if (defaultOpts.length > 0) {
        defaults[group.id] = defaultOpts;
      }
    }
    return defaults;
  });

  const [quantity, setQuantity] = useState(1);
  const [customText, setCustomText] = useState('');

  // Check if any group looks like an inscription/text group
  const inscriptionGroup = optionGroups.find(
    (g) =>
      g.name.toLowerCase().includes('inscription') ||
      g.name.toLowerCase().includes('text') ||
      g.name.toLowerCase().includes('message'),
  );

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!product) return 0;
    let optionsTotal = 0;
    for (const group of optionGroups) {
      const selected = selections[group.id] ?? [];
      for (const optId of selected) {
        const opt = group.options.find((o) => o.id === optId);
        if (opt) optionsTotal += opt.priceModifier;
      }
    }
    return (product.price + optionsTotal) * quantity;
  }, [product, optionGroups, selections, quantity]);

  const handleSingleSelect = (groupId: string, optionId: string) => {
    setSelections((prev) => ({ ...prev, [groupId]: [optionId] }));
  };

  const handleMultipleToggle = (groupId: string, optionId: string, maxSelections?: number) => {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      if (maxSelections && current.length >= maxSelections) {
        return prev;
      }
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Validate required groups
    for (const group of optionGroups) {
      if (group.isRequired && !(selections[group.id]?.length > 0)) {
        toast.error(`Please select an option for "${group.name}"`);
        return;
      }
    }

    const selectedOptions: SelectedOption[] = [];
    for (const group of optionGroups) {
      const selected = selections[group.id] ?? [];
      for (const optId of selected) {
        const opt = group.options.find((o) => o.id === optId);
        if (opt) {
          selectedOptions.push({
            groupId: group.id,
            groupName: group.name,
            optionId: opt.id,
            optionName: opt.name,
            priceAdjustment: opt.priceModifier,
          });
        }
      }
    }

    const cartProduct: CustomerCartProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category?.name ?? 'Other',
    };

    for (let i = 0; i < quantity; i++) {
      addItem(cartProduct, {
        selectedOptions,
        customText: customText.trim() || undefined,
      });
    }

    toast.success(`Added ${quantity}x ${product.name} to cart`);
    navigate(-1);
  };

  if (!locationId) {
    navigate('/');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p style={{ color: 'var(--color-text-muted)' }}>Product not found.</p>
        <button
          type="button"
          onClick={() => navigate('/menu')}
          className="mt-4 text-sm font-medium hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          Back to menu
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-24">
      {/* Back button */}
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm font-medium hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to menu
        </button>
      </div>

      {/* Product image */}
      <div className="aspect-video w-full overflow-hidden bg-gray-100">
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
          <span className="text-6xl opacity-30">🧁</span>
        </div>
      </div>

      {/* Product info */}
      <div className="px-4 py-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          {product.name}
        </h1>
        <p className="mt-1 font-mono text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
          {formatPrice(product.price)}
        </p>
        {product.description && (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            {product.description}
          </p>
        )}
      </div>

      {/* Option groups */}
      {optionGroups
        .filter((g) => g !== inscriptionGroup)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((group) => (
          <div key={group.id} className="border-t border-black/5 px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                {group.name}
                {group.isRequired && (
                  <span className="ml-1 text-xs text-red-500">Required</span>
                )}
              </h3>
              {group.type === 'multiple' && group.maxSelections && (
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Select up to {group.maxSelections}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {group.options
                .filter((o) => o.isActive)
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((option) => {
                  const selected = selections[group.id]?.includes(option.id) ?? false;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        group.type === 'single'
                          ? handleSingleSelect(group.id, option.id)
                          : handleMultipleToggle(group.id, option.id, group.maxSelections)
                      }
                      className="flex items-center justify-between p-3 text-left transition-colors"
                      style={{
                        borderRadius: 'var(--radius)',
                        border: selected
                          ? '2px solid var(--color-primary)'
                          : '1px solid rgba(0,0,0,0.1)',
                        backgroundColor: selected ? 'var(--color-surface)' : 'var(--color-card)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {/* Radio / checkbox indicator */}
                        <div
                          className="flex h-5 w-5 items-center justify-center"
                          style={{
                            borderRadius: group.type === 'single' ? '50%' : '4px',
                            border: selected
                              ? '2px solid var(--color-primary)'
                              : '2px solid rgba(0,0,0,0.2)',
                            backgroundColor: selected ? 'var(--color-primary)' : 'transparent',
                          }}
                        >
                          {selected && (
                            <svg
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          {option.name}
                        </span>
                      </div>
                      {option.priceModifier !== 0 && (
                        <span
                          className="font-mono text-sm"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {option.priceModifier > 0 ? '+' : ''}
                          {formatPrice(option.priceModifier)}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}

      {/* Custom text / inscription */}
      {inscriptionGroup && (
        <div className="border-t border-black/5 px-4 py-4">
          <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {inscriptionGroup.name}
          </h3>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Enter your custom text..."
            rows={2}
            maxLength={100}
            className="w-full border border-black/10 p-3 text-sm outline-none focus:ring-2"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-card)',
              color: 'var(--color-text)',
              '--tw-ring-color': 'var(--color-primary)',
            } as React.CSSProperties}
          />
          <p className="mt-1 text-right text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {customText.length}/100
          </p>
        </div>
      )}

      {/* Quantity */}
      <div className="border-t border-black/5 px-4 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Quantity
          </h3>
          <QuantityControl value={quantity} onChange={setQuantity} />
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 p-4 md:absolute"
        style={{ backgroundColor: 'var(--color-card)' }}
      >
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex h-12 w-full items-center justify-center gap-2 font-semibold text-white transition-colors"
            style={{
              backgroundColor: 'var(--color-primary)',
              borderRadius: 'var(--radius)',
            }}
          >
            <ShoppingBag className="h-5 w-5" />
            Add to Cart &mdash;{' '}
            <span className="font-mono">{formatPrice(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
