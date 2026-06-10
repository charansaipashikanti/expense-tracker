import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HandCoins, Calendar } from 'lucide-react';
import { useCreateSettlement } from '@/features/settlements/hooks';
import type { GroupMember } from '@/types';
import CustomSelect from '@/components/ui/CustomSelect';

const schema = z.object({
  paidBy: z.string().min(1, 'Please select who paid'),
  paidTo: z.string().min(1, 'Please select who was paid'),
  amount: z.coerce.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().max(200).optional(),
});

type FormInput = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: GroupMember[];
  prefilled: { paidBy: string; paidTo: string; amount: number } | null;
}

export default function SettleUpModal({ isOpen, onClose, groupId, members, prefilled }: Props) {
  const createSettlement = useCreateSettlement(groupId);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      notes: 'Settle up balances',
    },
  });

  // Apply prefilled values if they change
  useEffect(() => {
    if (prefilled) {
      setValue('paidBy', prefilled.paidBy);
      setValue('paidTo', prefilled.paidTo);
      setValue('amount', prefilled.amount);
    } else {
      reset({
        date: new Date().toISOString().split('T')[0],
        notes: 'Settle up balances',
      });
    }
  }, [prefilled, setValue, reset]);

  const onSubmit = async (data: FormInput) => {
    if (data.paidBy === data.paidTo) {
      alert("A member cannot settle with themselves!");
      return;
    }

    try {
      await createSettlement.mutateAsync({
        groupId,
        ...data,
      });
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
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-2xl p-6 overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                  <HandCoins className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Settlement</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Record a roommate-to-roommate payment</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Who Paid? (Payer)
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
                      placeholder="Select payer..."
                      error={!!errors.paidBy}
                    />
                  )}
                />
                {errors.paidBy && (
                  <p className="mt-1 text-xs text-red-500">{errors.paidBy.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Who was Paid? (Receiver)
                </label>
                <Controller
                  control={control}
                  name="paidTo"
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={members.map((m) => ({
                        value: m.userId,
                        label: m.user?.name || 'Unknown',
                      }))}
                      placeholder="Select receiver..."
                      error={!!errors.paidTo}
                    />
                  )}
                />
                {errors.paidTo && (
                  <p className="mt-1 text-xs text-red-500">{errors.paidTo.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
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

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Notes / Description
                </label>
                <input
                  type="text"
                  {...register('notes')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  placeholder="e.g. Paid cash, UPI payment"
                />
              </div>

              {/* Submit Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSettlement.isPending}
                  className="px-4 py-2.5 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/20"
                >
                  {createSettlement.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <HandCoins className="w-4 h-4" />
                      Record Settlement
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
