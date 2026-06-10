import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Calculator, Info, ChevronDown, Check } from 'lucide-react';
import { useCreateExpense } from '../hooks';
import type { GroupMember, SplitType, ExpenseCategory } from '@/types';

const categories = [
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
  title: z.string().min(3, 'Title must be at least 3 characters'),
  amount: z.coerce.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  customCategory: z.string().optional(),
  paidBy: z.string().min(1, 'Please select who paid'),
  splitType: z.enum(['equal', 'percentage', 'quantity', 'exact'] as const),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().max(200).optional(),
  splits: z.array(
    z.object({
      userId: z.string(),
      checked: z.boolean().default(true),
      percentage: z.coerce.number().min(0).max(100).optional(),
      quantity: z.coerce.number().min(0).optional(),
      amount: z.coerce.number().min(0).optional(),
    })
  ),
}).refine((data) => data.category !== 'custom' || (data.customCategory && data.customCategory.trim().length > 0), {
  message: 'Custom category name is required',
  path: ['customCategory'],
});

import CustomSelect from '@/components/ui/CustomSelect';
import { useGroupCategories } from '@/features/groups/hooks';

type FormInput = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: GroupMember[];
}

export default function AddExpenseModal({ isOpen, onClose, groupId, members }: Props) {
  const createExpense = useCreateExpense(groupId);
  const { data: groupCategories } = useGroupCategories(groupId);
  const [errorMsg, setErrorMsg] = useState('');

  const categoryOptions = groupCategories?.map((cat) => ({
    value: cat,
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
  })) || categories;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      splitType: 'equal',
      date: new Date().toISOString().split('T')[0],
      splits: members.map((m) => ({
        userId: m.userId,
        checked: true,
        percentage: 0,
        quantity: 0,
        amount: 0,
      })),
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'splits',
  });

  const watchAmount = watch('amount') || 0;
  const watchSplitType = watch('splitType');
  const watchSplits = watch('splits') || [];

  // Update default splits if amount or splitType changes
  useEffect(() => {
    if (watchSplitType === 'equal') {
      const activeMembers = watchSplits.filter((s) => s.checked);
      if (activeMembers.length > 0) {
        const perPerson = Math.round((watchAmount / activeMembers.length) * 100) / 100;
        watchSplits.forEach((split, index) => {
          if (split.checked) {
            setValue(`splits.${index}.amount`, perPerson);
          } else {
            setValue(`splits.${index}.amount`, 0);
          }
        });
      }
    }
  }, [watchAmount, watchSplitType, setValue]);

  const onSubmit = async (data: FormInput) => {
    setErrorMsg('');

    // Filter active splits
    const activeSplits = data.splits.filter((s) => s.checked);

    if (activeSplits.length === 0) {
      setErrorMsg('At least one member must be selected to split the expense');
      return;
    }

    // Validation based on split type
    if (data.splitType === 'percentage') {
      const sum = activeSplits.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        setErrorMsg(`Percentages must add up to 100%. Current sum: ${sum}%`);
        return;
      }
    } else if (data.splitType === 'exact') {
      const sum = activeSplits.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      if (Math.abs(sum - data.amount) > 0.01) {
        setErrorMsg(`Sum of split amounts (₹${sum}) must equal total amount (₹${data.amount})`);
        return;
      }
    } else if (data.splitType === 'quantity') {
      const sumQty = activeSplits.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
      if (sumQty <= 0) {
        setErrorMsg('Total quantity must be greater than 0');
        return;
      }
    }

    // Format request payload
    const payload = {
      groupId,
      title: data.title,
      amount: data.amount,
      category: data.category === 'custom' && data.customCategory ? data.customCategory.trim() : data.category,
      paidBy: data.paidBy,
      splitType: data.splitType,
      date: data.date,
      notes: data.notes || '',
      splits: activeSplits.map((s) => ({
        userId: s.userId,
        percentage: data.splitType === 'percentage' ? s.percentage : undefined,
        quantity: data.splitType === 'quantity' ? s.quantity : undefined,
        amount: data.splitType === 'exact' ? s.amount : undefined,
      })),
    };

    try {
      await createExpense.mutateAsync(payload);
      onClose();
    } catch {
      // Handled by hook
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl p-6 overflow-hidden z-10 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Expense</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Record a new shared expense</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Form (Scrollable) */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto flex-1 pr-1.5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Expense Title
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                    placeholder="e.g. Groceries, Electricity"
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                        placeholder="Enter custom category name"
                      />
                      {errors.customCategory && (
                        <p className="mt-1 text-xs text-red-500">{errors.customCategory.message}</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Paid By
                  </label>
                  <Controller
                    control={control}
                    name="paidBy"
                    render={({ field }) => (
                      <CustomSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={members.map((m) => ({
                          value: m.userId,
                          label: m.user?.name || 'Unknown',
                        }))}
                        placeholder="Select member..."
                        error={!!errors.paidBy}
                      />
                    )}
                  />
                  {errors.paidBy && (
                    <p className="mt-1 text-xs text-red-500">{errors.paidBy.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  />
                  {errors.date && (
                    <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Split Method
                  </label>
                  <Controller
                    control={control}
                    name="splitType"
                    render={({ field }) => (
                      <CustomSelect
                        value={field.value}
                        onChange={field.onChange}
                        options={[
                          { value: 'equal', label: 'Equally (Equal)' },
                          { value: 'percentage', label: 'By Percentage (%)' },
                          { value: 'quantity', label: 'By Quantity / Share' },
                          { value: 'exact', label: 'Exact Amounts (Direct)' },
                        ]}
                      />
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  {...register('notes')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  placeholder="Optional notes or details..."
                />
              </div>

              {/* Splits Section */}
              <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <Calculator className="w-4 h-4 text-brand-600" />
                  Split Breakdown
                </h4>

                <div className="space-y-3">
                  {fields.map((field, index) => {
                    const member = members.find((m) => m.userId === field.userId);
                    const splitChecked = watchSplits[index]?.checked;

                    return (
                      <div
                        key={field.id}
                        className={`flex items-center justify-between gap-4 p-2.5 rounded-xl border transition-all ${
                          splitChecked
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                            : 'bg-slate-100/40 dark:bg-slate-800/10 border-transparent opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            {...register(`splits.${index}.checked`)}
                            className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                          />
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white block truncate">
                              {member?.user?.name}
                            </span>
                            <span className="text-xs text-slate-500 truncate block">
                              {member?.user?.email}
                            </span>
                          </div>
                        </div>

                        {/* Input values based on split type */}
                        {splitChecked && (
                          <div className="flex items-center gap-2">
                            {watchSplitType === 'percentage' && (
                              <div className="relative w-20">
                                <input
                                  type="number"
                                  placeholder="0"
                                  {...register(`splits.${index}.percentage`)}
                                  className="w-full text-right pr-5 pl-2 py-1 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-900 dark:text-white"
                                />
                                <span className="absolute right-2 top-1.5 text-xs text-slate-400 font-medium">%</span>
                              </div>
                            )}

                            {watchSplitType === 'quantity' && (
                              <div className="relative w-20">
                                <input
                                  type="number"
                                  placeholder="0"
                                  {...register(`splits.${index}.quantity`)}
                                  className="w-full text-right px-2 py-1 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-900 dark:text-white"
                                />
                              </div>
                            )}

                            {watchSplitType === 'exact' && (
                              <div className="relative w-28">
                                <span className="absolute left-2 top-1.5 text-xs text-slate-400 font-semibold">₹</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...register(`splits.${index}.amount`)}
                                  className="w-full text-right pl-5 pr-2 py-1 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-slate-900 dark:text-white"
                                />
                              </div>
                            )}

                            {watchSplitType === 'equal' && (
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                ₹{(watchSplits[index]?.amount || 0).toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Info text */}
              <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-start gap-1.5 leading-normal bg-slate-50 dark:bg-slate-800/10 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                <Info className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5" />
                <span>
                  {watchSplitType === 'equal' && 'Equally splits the total amount among all selected roommates.'}
                  {watchSplitType === 'percentage' && 'Assigns expense share as a percentage of total cost for each member.'}
                  {watchSplitType === 'quantity' && 'Splits total cost proportionally based on the quantity consumed or shares owned.'}
                  {watchSplitType === 'exact' && 'Allows recording exact custom monetary amounts for each group member.'}
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6 flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createExpense.isPending}
                  className="px-4 py-2.5 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/20"
                >
                  {createExpense.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Expense
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
