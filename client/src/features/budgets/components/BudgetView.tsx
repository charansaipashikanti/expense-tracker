import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Plus, Activity, PieChart, TrendingUp, AlertTriangle } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import { useSetBudget, useGroupBudgets } from '../hooks';
import { useGroupBudgetUtilization } from '@/features/analytics/hooks';
import { useGroupCategories } from '@/features/groups/hooks';
import type { ExpenseCategory } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  groupId: string;
  isAdmin: boolean;
}

const categories: { value: ExpenseCategory; label: string }[] = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'vegetables', label: 'Vegetables & Fruits' },
  { value: 'milk', label: 'Milk & Dairy' },
  { value: 'electricity', label: 'Electricity Bill' },
  { value: 'internet', label: 'Internet / WiFi' },
  { value: 'gas', label: 'Gas / Fuel' },
  { value: 'water', label: 'Water Supply' },
  { value: 'maintenance', label: 'Room Maintenance' },
  { value: 'travel', label: 'Travel & Cab' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'snacks', label: 'Snacks & Drinks' },
  { value: 'cleaning', label: 'Cleaning Supplies' },
  { value: 'medical', label: 'Medical & Health' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'rent', label: 'Rent' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
];

const schema = z.object({
  category: z.string().min(1, 'Category is required'),
  customCategory: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be positive'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
}).refine((data) => data.category !== 'custom' || (data.customCategory && data.customCategory.trim().length > 0), {
  message: 'Custom category name is required',
  path: ['customCategory'],
});

type FormInput = z.infer<typeof schema>;

export default function BudgetView({ groupId, isAdmin }: Props) {
  const { data: utilization, isLoading: isUtilLoading } = useGroupBudgetUtilization(groupId);
  const { data: groupCategories } = useGroupCategories(groupId);
  const setBudget = useSetBudget(groupId);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const categoryOptions = groupCategories?.map((cat) => ({
    value: cat as ExpenseCategory,
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
  })) || categories;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      month: currentMonth,
      year: currentYear,
    },
  });

  const onSubmit = async (data: FormInput) => {
    try {
      const payload = {
        amount: data.amount,
        month: data.month,
        year: data.year,
        category: data.category === 'custom' && data.customCategory ? data.customCategory.trim() : data.category,
      };
      await setBudget.mutateAsync(payload);
      setIsConfiguring(false);
      reset({
        month: currentMonth,
        year: currentYear,
        category: '',
        customCategory: '',
        amount: 0,
      });
    } catch {
      // Handled by hook
    }
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-rose-500';
    if (pct >= 85) return 'bg-amber-500';
    return 'bg-brand-500';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Budgets</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Set limits per category to control roommate spendings</p>
        </div>
        {isAdmin && !isConfiguring && (
          <button
            onClick={() => setIsConfiguring(true)}
            className="px-3 py-2 border border-brand-200 dark:border-brand-500/20 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Configure Budget
          </button>
        )}
      </div>

      {isUtilLoading ? (
        <div className="space-y-4">
          <div className="h-28 skeleton rounded-2xl w-full" />
          <div className="h-40 skeleton rounded-2xl w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Budgets Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configure Budget Form */}
            {isConfiguring && (
              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CreditCard className="w-4.5 h-4.5 text-brand-600" />
                  Configure Budget Limit
                </h4>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Category
                      </label>
                      <Controller
                        control={control}
                        name="category"
                        render={({ field }) => (
                          <CustomSelect
                            value={field.value}
                            onChange={field.onChange}
                            options={[
                              ...categoryOptions,
                              { value: 'custom', label: '+ Add Custom Category...' }
                            ]}
                            placeholder="Select category..."
                            error={!!errors.category}
                          />
                        )}
                      />
                      {errors.category && (
                        <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>
                      )}
                      {watch('category') === 'custom' && (
                        <div className="mt-2 animate-fade-in">
                          <input
                            type="text"
                            {...register('customCategory')}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                            placeholder="Enter custom category name"
                          />
                          {errors.customCategory && (
                            <p className="mt-1 text-xs text-red-500">{errors.customCategory.message}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Budget Amount (₹)
                      </label>
                      <input
                        type="number"
                        {...register('amount')}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                        placeholder="e.g. 5000"
                      />
                      {errors.amount && (
                        <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Month
                      </label>
                      <Controller
                        control={control}
                        name="month"
                        render={({ field }) => (
                          <CustomSelect
                            value={String(field.value)}
                            onChange={(val) => field.onChange(Number(val))}
                            options={Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
                              value: String(m),
                              label: new Date(0, m - 1).toLocaleString('default', { month: 'long' }),
                            }))}
                            placeholder="Select month..."
                          />
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Year
                      </label>
                      <Controller
                        control={control}
                        name="year"
                        render={({ field }) => (
                          <CustomSelect
                            value={String(field.value)}
                            onChange={(val) => field.onChange(Number(val))}
                            options={Array.from({ length: 8 }, (_, i) => currentYear - 2 + i).map((y) => ({
                              value: String(y),
                              label: String(y),
                            }))}
                            placeholder="Select year..."
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsConfiguring(false)}
                      className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-3.5 py-2 gradient-bg text-white text-xs font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1"
                    >
                      {setBudget.isPending ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Save Budget'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Budget Utilization Bars */}
            <div className="bg-white dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-850 p-6 rounded-2xl space-y-6">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <PieChart className="w-5 h-5 text-brand-600" />
                Current Month Utilization
              </h4>

              {utilization?.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No category budgets set for this month yet.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {utilization?.map((u) => {
                    const isOver = u.spent > u.budget;
                    const displayPct = Math.min(u.percentage, 100);

                    return (
                      <div key={u.category} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span className="capitalize">{u.category}</span>
                          <div className="flex items-center gap-1">
                            <span>{formatCurrency(u.spent)}</span>
                            <span className="text-slate-400 font-medium">of {formatCurrency(u.budget)}</span>
                          </div>
                        </div>

                        {/* Progress bar container */}
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(u.percentage)}`}
                            style={{ width: `${displayPct}%` }}
                          />
                        </div>

                        {/* Over-budget alerts */}
                        {isOver && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase tracking-wide">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Over budget by {formatCurrency(u.spent - u.budget)}!</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick Insights Panel */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Budget Insights
            </h4>

            <div className="bg-brand-50/50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/10 p-5 rounded-2xl space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Setting category budgets helps keep shared roommate expenditures under control.
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                Tip: If rent splits are paid as part of group expenses, exclude them from category budgeting to maintain correct grocery limits!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
