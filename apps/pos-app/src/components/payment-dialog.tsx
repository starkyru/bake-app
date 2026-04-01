import { useState } from 'react';
import {
  X,
  Banknote,
  CreditCard,
  Nfc,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { CurrencyDisplay } from '@bake-app/react/ui';

export interface PaymentResult {
  method: 'cash' | 'card';
  amountPaid: number;
  change: number;
}

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  total: number;
  itemCount: number;
  onConfirm: (result: PaymentResult) => void;
}

type PaymentTab = 'cash' | 'card';

export function PaymentDialog({
  open,
  onClose,
  total,
  itemCount,
  onConfirm,
}: PaymentDialogProps) {
  const [tab, setTab] = useState<PaymentTab>('cash');
  const [cashAmount, setCashAmount] = useState('');

  if (!open) return null;

  const numericAmount = parseFloat(cashAmount) || 0;
  const change = numericAmount - total;
  const isSufficient = numericAmount >= total;
  const isInsufficient = numericAmount > 0 && numericAmount < total;

  const roundUp = (n: number): number => {
    if (n <= 100) return Math.ceil(n / 10) * 10;
    if (n <= 1000) return Math.ceil(n / 100) * 100;
    return Math.ceil(n / 1000) * 1000;
  };

  const quickAmounts = [
    { label: 'Exact', value: total },
    { label: '+$500', value: numericAmount + 500 },
    { label: '+$1000', value: numericAmount + 1000 },
    { label: '+$2000', value: numericAmount + 2000 },
    { label: '+$5000', value: numericAmount + 5000 },
    { label: `Round up ($${roundUp(total).toLocaleString()})`, value: roundUp(total) },
  ];

  function handleCashConfirm() {
    if (!isSufficient) return;
    onConfirm({ method: 'cash', amountPaid: numericAmount, change });
    resetAndClose();
  }

  function handleCardConfirm() {
    onConfirm({ method: 'card', amountPaid: total, change: 0 });
    resetAndClose();
  }

  function resetAndClose() {
    setCashAmount('');
    setTab('cash');
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-[480px] mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1 text-[#5d4037] hover:bg-[#faf3e8] transition-colors border-none bg-transparent cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Total due header */}
        <div className="bg-[#faf3e8] px-6 py-5 text-center">
          <p className="text-sm text-[#5d4037] mb-1">Total Due ({itemCount} items)</p>
          <p className="text-3xl font-bold font-mono text-[#3e2723]">
            ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab('cash')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-none cursor-pointer transition-colors ${
              tab === 'cash'
                ? 'text-[#8b4513] border-b-2 border-[#8b4513] bg-white'
                : 'text-gray-500 bg-gray-50 hover:text-[#5d4037]'
            }`}
          >
            <Banknote size={18} />
            Cash
          </button>
          <button
            type="button"
            onClick={() => setTab('card')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-none cursor-pointer transition-colors ${
              tab === 'card'
                ? 'text-[#1565c0] border-b-2 border-[#1565c0] bg-white'
                : 'text-gray-500 bg-gray-50 hover:text-[#5d4037]'
            }`}
          >
            <CreditCard size={18} />
            Card
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {tab === 'cash' ? (
            <div className="space-y-4">
              {/* Amount input */}
              <div>
                <label className="block text-sm font-medium text-[#5d4037] mb-1.5">
                  Amount Received
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-mono text-[#5d4037]">
                    $
                  </span>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-4 text-2xl font-mono font-semibold text-[#3e2723]
                      border border-[#d7ccc8] rounded-xl bg-white
                      focus:outline-none focus:border-[#8b4513] focus:ring-2 focus:ring-[#8b4513]/20
                      transition-colors placeholder-gray-300"
                  />
                </div>
              </div>

              {/* Quick amount buttons */}
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((qa) => (
                  <button
                    key={qa.label}
                    type="button"
                    onClick={() => setCashAmount(qa.value.toFixed(2))}
                    className="py-2 px-3 text-xs font-medium text-[#5d4037] bg-[#faf3e8]
                      rounded-lg border border-[#8b4513]/10 hover:bg-[#f5e6d0]
                      transition-colors cursor-pointer"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>

              {/* Change display */}
              {isSufficient && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle2 className="text-green-600 shrink-0" size={24} />
                  <div>
                    <p className="text-sm font-medium text-green-800">Change</p>
                    <p className="text-xl font-mono font-bold text-green-700">
                      ${change.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Insufficient warning */}
              {isInsufficient && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertTriangle className="text-red-600 shrink-0" size={24} />
                  <div>
                    <p className="text-sm font-medium text-red-800">Insufficient amount</p>
                    <p className="text-sm text-red-600">
                      Need ${(total - numericAmount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} more
                    </p>
                  </div>
                </div>
              )}

              {/* Confirm button */}
              <button
                type="button"
                onClick={handleCashConfirm}
                disabled={!isSufficient}
                className="w-full py-3.5 bg-green-600 text-white text-base font-semibold rounded-xl
                  border-none cursor-pointer hover:bg-green-700 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                <Banknote size={20} />
                Complete Cash Payment
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 py-6">
              {/* Card icon */}
              <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">
                <Nfc className="text-[#1565c0]" size={48} />
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold text-[#3e2723] mb-1">
                  Ready for card payment
                </p>
                <p className="text-sm text-gray-500">
                  Tap, insert, or swipe card
                </p>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500">Amount</p>
                <CurrencyDisplay amount={total} size="lg" />
              </div>

              {/* Confirm button */}
              <button
                type="button"
                onClick={handleCardConfirm}
                className="w-full py-3.5 bg-[#1565c0] text-white text-base font-semibold rounded-xl
                  border-none cursor-pointer hover:bg-[#0d47a1] transition-colors
                  flex items-center justify-center gap-2"
              >
                <CreditCard size={20} />
                Process Card Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
