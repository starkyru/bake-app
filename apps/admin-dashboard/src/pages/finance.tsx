import { useMemo, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Plus,
  X,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useFinanceSummary,
  useExpenses,
  useCreateExpense,
  useFinanceTransactions,
} from '@bake-app/react/api-client';
import {
  PageContainer,
  StatsCard,
  DataTable,
  LoadingSpinner,
  CurrencyDisplay,
  type TableColumn,
} from '@bake-app/react/ui';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

const EXPENSE_CATEGORIES = [
  'ingredients',
  'utilities',
  'rent',
  'salaries',
  'equipment',
  'marketing',
  'maintenance',
  'other',
];

export function FinancePage() {
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const { data: summary, isLoading: summaryLoading } =
    useFinanceSummary(dateRange);
  const { data: expenses, isLoading: expensesLoading } =
    useExpenses(dateRange);
  const { data: transactions, isLoading: transactionsLoading } =
    useFinanceTransactions({ ...dateRange, limit: 50 });
  const createExpense = useCreateExpense();

  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'ingredients',
    amount: 0,
    description: '',
  });

  const summaryData = (summary as any) ?? {};
  const transactionList = (transactions as any)?.data ?? ((transactions as unknown) as any[]) ?? [];
  const expenseList = (expenses as any)?.data ?? (expenses as any[]) ?? [];

  const totalRevenue = summaryData.totalRevenue ?? 0;
  const totalExpenses = summaryData.totalExpenses ?? 0;
  const netProfit = totalRevenue - totalExpenses;
  const foodCostPct =
    totalRevenue > 0
      ? ((totalExpenses / totalRevenue) * 100).toFixed(1)
      : '0.0';

  // Group expenses by category
  const expenseByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    for (const exp of expenseList) {
      const cat = exp.category ?? 'other';
      grouped[cat] = (grouped[cat] ?? 0) + (exp.amount ?? 0);
    }
    return Object.entries(grouped)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenseList]);

  const handleCreateExpense = () => {
    if (!expenseForm.amount || expenseForm.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setSaving(true);
    createExpense.mutate(
      {
        category: expenseForm.category,
        amount: expenseForm.amount,
        description: expenseForm.description || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Expense recorded');
          setShowExpenseDialog(false);
          setExpenseForm({ category: 'ingredients', amount: 0, description: '' });
          setSaving(false);
        },
        onError: () => {
          toast.error('Failed to create expense');
          setSaving(false);
        },
      },
    );
  };

  const transactionColumns: TableColumn[] = [
    {
      key: 'createdAt',
      label: 'Date',
      type: 'date',
      sortable: true,
    },
    {
      key: 'type',
      label: 'Type',
      type: 'badge',
    },
    {
      key: 'category',
      label: 'Category',
      render: (value: string) => (
        <span className="text-sm capitalize text-gray-700">
          {(value ?? '').replace(/_/g, ' ') || '\u2014'}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (value: string) => (
        <span className="max-w-[200px] truncate text-sm text-gray-500">
          {value || '\u2014'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      type: 'currency',
      sortable: true,
    },
  ];

  const isLoading = summaryLoading || expensesLoading || transactionsLoading;

  return (
    <PageContainer
      title="Finance"
      subtitle="Revenue, expenses, and financial overview"
      actions={
        <button
          type="button"
          onClick={() => setShowExpenseDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-[#5d4037] active:scale-95"
        >
          <Plus size={16} />
          Add Expense
        </button>
      }
    >
      {/* Date Range Picker */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#8b4513]/10 bg-white p-4 shadow-sm">
        <span className="text-sm font-medium text-gray-600">Period:</span>
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) =>
            setDateRange({ ...dateRange, startDate: e.target.value })
          }
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
        />
        <span className="text-gray-400">to</span>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) =>
            setDateRange({ ...dateRange, endDate: e.target.value })
          }
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
        />
      </div>

      {isLoading && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-[#8b4513]/10">
          <div className="h-full w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite] rounded-full bg-[#8b4513]" />
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(400%); }
            }
          `}</style>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={<DollarSign size={20} />}
          color="success"
        />
        <StatsCard
          title="Total Expenses"
          value={`$${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={<TrendingDown size={20} />}
          color="danger"
        />
        <StatsCard
          title="Net Profit"
          value={`$${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={<TrendingUp size={20} />}
          color={netProfit >= 0 ? 'success' : 'danger'}
        />
        <StatsCard
          title="Food Cost %"
          value={`${foodCostPct}%`}
          icon={<Percent size={20} />}
          color="warning"
        />
      </div>

      {/* Expense Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#8b4513]/10 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-[#3e2723]">
            Expense Breakdown
          </h3>
          {expenseByCategory.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No expenses in this period
            </p>
          ) : (
            <div className="space-y-3">
              {expenseByCategory.map(({ category, amount }) => {
                const pct =
                  totalExpenses > 0
                    ? ((amount / totalExpenses) * 100).toFixed(1)
                    : '0';
                return (
                  <div key={category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="capitalize text-gray-700">
                        {category.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <CurrencyDisplay amount={amount} size="sm" />
                        <span className="text-xs text-gray-400">
                          ({pct}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#8b4513] transition-all"
                        style={{
                          width: `${totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue Trend (simple list) */}
        <div className="rounded-xl border border-[#8b4513]/10 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-[#3e2723]">
            Recent Transactions
          </h3>
          {transactionList.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              No transactions in this period
            </p>
          ) : (
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {transactionList.slice(0, 15).map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-gray-50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`rounded-full p-1.5 ${
                        tx.type === 'revenue'
                          ? 'bg-green-100 text-green-600'
                          : tx.type === 'expense'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Receipt size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {tx.description || tx.category || tx.type}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-sm font-semibold ${
                      tx.type === 'revenue'
                        ? 'text-green-700'
                        : 'text-red-700'
                    }`}
                  >
                    {tx.type === 'revenue' ? '+' : '-'}$
                    {Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-[#3e2723]">
          All Transactions
        </h3>
        {transactionsLoading ? (
          <LoadingSpinner message="Loading transactions..." />
        ) : (
          <DataTable
            columns={transactionColumns}
            data={transactionList}
            searchable
            searchPlaceholder="Search transactions..."
            pageSize={10}
          />
        )}
      </div>

      {/* Add Expense Dialog */}
      {showExpenseDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowExpenseDialog(false)}
        >
          <div
            className="relative mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowExpenseDialog(false)}
              className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold text-[#3e2723]">
              Add Expense
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      category: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm capitalize focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Amount *
                </label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      amount: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/30"
                  placeholder="Optional description..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowExpenseDialog(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateExpense}
                disabled={saving}
                className="rounded-lg bg-[#8b4513] px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-[#5d4037] active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
