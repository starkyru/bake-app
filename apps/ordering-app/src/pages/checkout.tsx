import { useState, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { useNavigate } from 'react-router';
import { Check, MapPin, Clock, CreditCard, ClipboardList, Truck, ShoppingBag, Store } from 'lucide-react';
import {
  useCustomerCartStore,
  useOrderingUIStore,
  selectCustomerSubtotal,
} from '@bake-app/react/store';
import {
  useCreateOnlineOrder,
  useCustomerAddresses,
  useAvailableDates,
  useOnlineLocationDetail,
} from '@bake-app/react/api-client';
import { useCustomerAuth } from '@bake-app/react/customer-auth';
import { toast } from 'sonner';

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

const STEPS = ['Fulfillment', 'Schedule', 'Payment', 'Review'] as const;
const STEP_ICONS = [Truck, Clock, CreditCard, ClipboardList];
const TIP_OPTIONS = [0, 10, 15, 20];
const TAX_RATE = 0.08;

type FulfillmentMethod = 'pickup' | 'delivery' | 'dine-in';

interface LocationConfigData {
  pickupEnabled?: boolean;
  deliveryEnabled?: boolean;
  shippingEnabled?: boolean;
  dineInQrEnabled?: boolean;
  taxRate?: number;
}

interface AddressData {
  id: string;
  label: string;
  street: string;
  city: string;
  state?: string;
  zip: string;
  isDefault: boolean;
}

interface AvailableDateData {
  date: string;
  slots: string[];
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isAsap, setIsAsap] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('pay_on_pickup');
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [customTip, setCustomTip] = useState<string>('');
  const [isCustomTip, setIsCustomTip] = useState(false);

  const items = useCustomerCartStore((s) => s.items);
  const clear = useCustomerCartStore((s) => s.clear);
  const setFulfillment = useCustomerCartStore((s) => s.setFulfillment);
  const setTip = useCustomerCartStore((s) => s.setTip);
  const subtotal = useCustomerCartStore(selectCustomerSubtotal);
  const locationId = useOrderingUIStore((s) => s.selectedLocationId);

  const { isAuthenticated, customer, continueAsGuest } = useCustomerAuth();

  const { data: locationData } = useOnlineLocationDetail(locationId ?? '');
  const { data: addressData } = useCustomerAddresses();
  const { data: datesData } = useAvailableDates(locationId ?? '');

  const createOrder = useCreateOnlineOrder();

  const locConfig = (locationData as { config?: LocationConfigData } | undefined)?.config;
  const addresses = (addressData as AddressData[] | undefined) ?? [];
  const availableDates = (datesData as AvailableDateData[] | undefined) ?? [];

  const taxRate = locConfig?.taxRate ?? TAX_RATE;
  const tax = new BigNumber(subtotal).times(taxRate).div(100).decimalPlaces(2, BigNumber.ROUND_HALF_UP).toNumber();
  const tipAmount = isCustomTip
    ? parseFloat(customTip) || 0
    : new BigNumber(subtotal).times(tipPercent).div(100).decimalPlaces(2, BigNumber.ROUND_HALF_UP).toNumber();
  const total = new BigNumber(subtotal).plus(tax).plus(tipAmount).toNumber();

  const enabledMethods = useMemo<{ key: FulfillmentMethod; label: string; icon: typeof Truck }[]>(() => {
    const methods: { key: FulfillmentMethod; label: string; icon: typeof Truck }[] = [];
    if (locConfig?.pickupEnabled) methods.push({ key: 'pickup', label: 'Pickup', icon: ShoppingBag });
    if (locConfig?.deliveryEnabled) methods.push({ key: 'delivery', label: 'Delivery', icon: Truck });
    if (locConfig?.dineInQrEnabled) methods.push({ key: 'dine-in', label: 'Dine-in', icon: Store });
    // If no config loaded yet, show pickup as default
    if (methods.length === 0) methods.push({ key: 'pickup', label: 'Pickup', icon: ShoppingBag });
    return methods;
  }, [locConfig]);

  const canProceed = (): boolean => {
    if (step === 0) return !!fulfillmentMethod && (fulfillmentMethod !== 'delivery' || !!selectedAddressId);
    if (step === 1) return isAsap || (!!selectedDate && !!selectedTimeSlot);
    if (step === 2) return !!paymentMethod;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handlePlaceOrder = async () => {
    if (!locationId) return;

    if (!isAuthenticated) {
      try {
        await continueAsGuest();
      } catch {
        toast.error('Failed to create guest session. Please try logging in.');
        return;
      }
    }

    setFulfillment({
      method: fulfillmentMethod === 'dine-in' ? 'dine-in' : fulfillmentMethod!,
      locationId,
      scheduledDate: isAsap ? undefined : selectedDate ?? undefined,
      scheduledTimeSlot: isAsap ? undefined : selectedTimeSlot ?? undefined,
      deliveryAddressId: fulfillmentMethod === 'delivery' ? selectedAddressId ?? undefined : undefined,
    });
    setTip(tipAmount);

    const orderItems = items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions.map((o) => ({
        optionGroupName: o.groupName,
        optionName: o.optionName,
        priceModifier: o.priceAdjustment,
      })),
      customText: item.customText,
      notes: item.notes,
    }));

    try {
      const result = await createOrder.mutateAsync({
        locationId,
        fulfillmentType: fulfillmentMethod,
        scheduledDate: isAsap ? undefined : selectedDate,
        scheduledTimeSlot: isAsap ? undefined : selectedTimeSlot,
        deliveryAddressId: fulfillmentMethod === 'delivery' ? selectedAddressId : undefined,
        paymentMethod,
        tip: tipAmount,
        items: orderItems,
      });
      clear();
      const orderId = (result as { id?: string })?.id ?? '';
      navigate(`/order-confirmation/${orderId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to place order');
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-1">
        {STEPS.map((label, i) => {
          const Icon = STEP_ICONS[i];
          const isActive = i === step;
          const isCompleted = i < step;
          return (
            <div key={label} className="flex items-center">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                  style={{
                    backgroundColor: isActive || isCompleted
                      ? 'var(--color-primary)'
                      : 'var(--color-surface)',
                    color: isActive || isCompleted ? 'white' : 'var(--color-text-muted)',
                  }}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className="text-[10px] font-medium"
                  style={{
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}
                >
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className="mx-1 h-0.5 w-6 md:w-12"
                  style={{
                    backgroundColor: i < step ? 'var(--color-primary)' : 'rgba(0,0,0,0.1)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Fulfillment */}
      {step === 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            How would you like to receive your order?
          </h2>
          <div className="flex flex-col gap-3">
            {enabledMethods.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFulfillmentMethod(key)}
                className="flex items-center gap-4 p-4 text-left transition-all"
                style={{
                  borderRadius: 'var(--radius)',
                  border:
                    fulfillmentMethod === key
                      ? '2px solid var(--color-primary)'
                      : '1px solid rgba(0,0,0,0.1)',
                  backgroundColor:
                    fulfillmentMethod === key ? 'var(--color-surface)' : 'var(--color-card)',
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    backgroundColor:
                      fulfillmentMethod === key
                        ? 'var(--color-primary)'
                        : 'var(--color-surface)',
                    color: fulfillmentMethod === key ? 'white' : 'var(--color-text-muted)',
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Delivery address selector */}
          {fulfillmentMethod === 'delivery' && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Delivery Address
              </h3>
              {addresses.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No saved addresses.{' '}
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => navigate('/account/addresses')}
                      className="font-medium hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      Add one
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="font-medium hover:underline"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      Log in to use saved addresses
                    </button>
                  )}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => setSelectedAddressId(addr.id)}
                      className="flex items-start gap-3 p-3 text-left transition-all"
                      style={{
                        borderRadius: 'var(--radius)',
                        border:
                          selectedAddressId === addr.id
                            ? '2px solid var(--color-primary)'
                            : '1px solid rgba(0,0,0,0.1)',
                        backgroundColor: 'var(--color-card)',
                      }}
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <span className="text-xs font-medium uppercase" style={{ color: 'var(--color-accent)' }}>
                          {addr.label}
                        </span>
                        <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                          {addr.street}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zip}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Schedule */}
      {step === 1 && (
        <div>
          <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            When would you like your order?
          </h2>

          {/* ASAP option */}
          <button
            type="button"
            onClick={() => {
              setIsAsap(true);
              setSelectedDate(null);
              setSelectedTimeSlot(null);
            }}
            className="mb-4 flex w-full items-center gap-3 p-4 text-left transition-all"
            style={{
              borderRadius: 'var(--radius)',
              border: isAsap
                ? '2px solid var(--color-primary)'
                : '1px solid rgba(0,0,0,0.1)',
              backgroundColor: isAsap ? 'var(--color-surface)' : 'var(--color-card)',
            }}
          >
            <Clock className="h-5 w-5" style={{ color: isAsap ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
            <div>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                As Soon As Possible
              </span>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Estimated 30-45 minutes
              </p>
            </div>
          </button>

          {/* Date selection */}
          <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Or schedule for later
          </h3>
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {availableDates.length > 0
              ? availableDates.slice(0, 7).map((d) => {
                  const date = new Date(d.date);
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const isSelected = selectedDate === d.date;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => {
                        setSelectedDate(d.date);
                        setSelectedTimeSlot(null);
                        setIsAsap(false);
                      }}
                      className="flex shrink-0 flex-col items-center px-4 py-2 transition-colors"
                      style={{
                        borderRadius: 'var(--radius)',
                        backgroundColor: isSelected
                          ? 'var(--color-primary)'
                          : 'var(--color-card)',
                        color: isSelected ? 'white' : 'var(--color-text)',
                        border: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      <span className="text-xs font-medium">{dayName}</span>
                      <span className="text-lg font-bold">{dayNum}</span>
                    </button>
                  );
                })
              : Array.from({ length: 5 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split('T')[0];
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = date.getDate();
                  const isSelected = selectedDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setSelectedTimeSlot(null);
                        setIsAsap(false);
                      }}
                      className="flex shrink-0 flex-col items-center px-4 py-2 transition-colors"
                      style={{
                        borderRadius: 'var(--radius)',
                        backgroundColor: isSelected
                          ? 'var(--color-primary)'
                          : 'var(--color-card)',
                        color: isSelected ? 'white' : 'var(--color-text)',
                        border: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      <span className="text-xs font-medium">{dayName}</span>
                      <span className="text-lg font-bold">{dayNum}</span>
                    </button>
                  );
                })}
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div>
              <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                Select a time
              </h3>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {(
                  availableDates.find((d) => d.date === selectedDate)?.slots ?? [
                    '09:00',
                    '10:00',
                    '11:00',
                    '12:00',
                    '13:00',
                    '14:00',
                    '15:00',
                    '16:00',
                  ]
                ).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTimeSlot(slot)}
                    className="py-2.5 text-center text-sm font-medium transition-colors"
                    style={{
                      borderRadius: 'var(--radius)',
                      backgroundColor:
                        selectedTimeSlot === slot
                          ? 'var(--color-primary)'
                          : 'var(--color-card)',
                      color: selectedTimeSlot === slot ? 'white' : 'var(--color-text)',
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 2 && (
        <div>
          <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            Payment Method
          </h2>
          <div className="mb-6 flex flex-col gap-3">
            {[
              { key: 'stripe', label: 'Card (Stripe)', icon: CreditCard },
              { key: 'paypal', label: 'PayPal', icon: CreditCard },
              { key: 'pay_on_pickup', label: 'Pay on Pickup', icon: ShoppingBag },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setPaymentMethod(key)}
                className="flex items-center gap-4 p-4 text-left transition-all"
                style={{
                  borderRadius: 'var(--radius)',
                  border:
                    paymentMethod === key
                      ? '2px solid var(--color-primary)'
                      : '1px solid rgba(0,0,0,0.1)',
                  backgroundColor:
                    paymentMethod === key ? 'var(--color-surface)' : 'var(--color-card)',
                }}
              >
                <Icon
                  className="h-5 w-5"
                  style={{
                    color: paymentMethod === key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}
                />
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Stripe placeholder */}
          {paymentMethod === 'stripe' && (
            <div
              className="mb-6 p-4"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-card)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Card payment form will appear here (Stripe Elements integration).
              </p>
              <div className="mt-3 h-10 rounded border border-dashed border-gray-300 bg-gray-50" />
            </div>
          )}

          {/* Tip */}
          <h3 className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            Add a tip
          </h3>
          <div className="flex gap-2">
            {TIP_OPTIONS.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => {
                  setTipPercent(pct);
                  setIsCustomTip(false);
                }}
                className="flex-1 py-2 text-center text-sm font-medium transition-colors"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor:
                    !isCustomTip && tipPercent === pct
                      ? 'var(--color-primary)'
                      : 'var(--color-card)',
                  color:
                    !isCustomTip && tipPercent === pct ? 'white' : 'var(--color-text)',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                {pct === 0 ? 'None' : `${pct}%`}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setIsCustomTip(true);
                setTipPercent(0);
              }}
              className="flex-1 py-2 text-center text-sm font-medium transition-colors"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: isCustomTip ? 'var(--color-primary)' : 'var(--color-card)',
                color: isCustomTip ? 'white' : 'var(--color-text)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              Custom
            </button>
          </div>
          {isCustomTip && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.50"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                placeholder="0.00"
                className="h-10 w-32 border border-black/10 px-3 font-mono text-sm outline-none focus:ring-2"
                style={{
                  borderRadius: 'var(--radius)',
                  backgroundColor: 'var(--color-card)',
                  color: 'var(--color-text)',
                  '--tw-ring-color': 'var(--color-primary)',
                } as React.CSSProperties}
              />
            </div>
          )}
        </div>
      )}

      {/* Step 4: Review */}
      {step === 3 && (
        <div>
          <h2 className="mb-4 text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            Review Your Order
          </h2>

          {/* Auth prompt */}
          {!isAuthenticated && (
            <div
              className="mb-4 p-4"
              style={{
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <p className="mb-2 text-sm" style={{ color: 'var(--color-text)' }}>
                Want to track your order and earn rewards?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-full px-4 py-2 text-xs font-medium text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  Log In
                </button>
                <button
                  type="button"
                  className="rounded-full px-4 py-2 text-xs font-medium"
                  style={{
                    border: '1px solid var(--color-primary)',
                    color: 'var(--color-primary)',
                  }}
                  onClick={() => {
                    /* Guest flow handled at place order */
                  }}
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          )}

          {/* Order items */}
          <div
            className="mb-4 p-4"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-card)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Items ({items.length})
            </h3>
            {items.map((item) => {
              const optionsPrice = item.selectedOptions.reduce(
                (sum, o) => sum + o.priceAdjustment,
                0,
              );
              return (
                <div
                  key={item.id}
                  className="flex items-start justify-between py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p style={{ color: 'var(--color-text)' }}>
                      {item.quantity}x {item.product.name}
                    </p>
                    {item.selectedOptions.length > 0 && (
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {item.selectedOptions.map((o) => o.optionName).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-mono" style={{ color: 'var(--color-text)' }}>
                    {formatPrice((item.product.price + optionsPrice) * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Fulfillment summary */}
          <div
            className="mb-4 p-4"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-card)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Fulfillment</span>
              <span className="font-medium capitalize" style={{ color: 'var(--color-text)' }}>
                {fulfillmentMethod ?? 'Not selected'}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Schedule</span>
              <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                {isAsap ? 'ASAP' : selectedDate ? `${selectedDate} at ${selectedTimeSlot}` : 'Not selected'}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Payment</span>
              <span className="font-medium capitalize" style={{ color: 'var(--color-text)' }}>
                {paymentMethod.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Total breakdown */}
          <div
            className="p-4"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-card)',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
              <span className="font-mono" style={{ color: 'var(--color-text)' }}>
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span style={{ color: 'var(--color-text-muted)' }}>Tax</span>
              <span className="font-mono" style={{ color: 'var(--color-text)' }}>
                {formatPrice(tax)}
              </span>
            </div>
            {tipAmount > 0 && (
              <div className="mt-1 flex justify-between text-sm">
                <span style={{ color: 'var(--color-text-muted)' }}>Tip</span>
                <span className="font-mono" style={{ color: 'var(--color-text)' }}>
                  {formatPrice(tipAmount)}
                </span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-black/5 pt-2">
              <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                Total
              </span>
              <span
                className="font-mono text-lg font-bold"
                style={{ color: 'var(--color-primary)' }}
              >
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="flex-1 py-3 text-sm font-medium transition-colors"
            style={{
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(0,0,0,0.1)',
              backgroundColor: 'var(--color-card)',
              color: 'var(--color-text)',
            }}
          >
            Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-primary)',
            }}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={createOrder.isPending}
            className="flex-1 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--color-primary)',
            }}
          >
            {createOrder.isPending ? 'Placing Order...' : 'Place Order'}
          </button>
        )}
      </div>
    </div>
  );
}
