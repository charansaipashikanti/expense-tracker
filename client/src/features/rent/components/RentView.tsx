import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, Calendar, Plus, History, Coins } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';
import type { GroupMember } from '@/types';
import { useRentHistory, useCurrentRent, useConfigureRent } from '../hooks';
import { formatCurrency } from '@/lib/utils';

interface Props {
  groupId: string;
  members: GroupMember[];
  isAdmin: boolean;
}

const schema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100),
});

type FormInput = z.infer<typeof schema>;

export default function RentView({ groupId, members, isAdmin }: Props) {
  const { data: rentHistory, isLoading: isHistoryLoading } = useRentHistory(groupId);
  const { data: currentRent, isLoading: isCurrentLoading } = useCurrentRent(groupId);
  const configureRent = useConfigureRent(groupId);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      amount: currentRent?.amount || 0,
      month: currentMonth,
      year: currentYear,
    },
  });

  const onSubmit = async (data: FormInput) => {
    try {
      await configureRent.mutateAsync(data);
      setIsConfiguring(false);
      reset();
    } catch {
      // Handled by hook
    }
  };

  const isLoading = isHistoryLoading || isCurrentLoading;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Rent</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure and track monthly apartment rent</p>
        </div>
        {isAdmin && !isConfiguring && (
          <button
            onClick={() => setIsConfiguring(true)}
            className="px-3 py-2 border border-brand-200 dark:border-brand-500/20 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Configure Rent
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-32 skeleton rounded-2xl w-full" />
          <div className="h-40 skeleton rounded-2xl w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configure Rent Form */}
            {isConfiguring && (
              <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Home className="w-4.5 h-4.5 text-brand-600" />
                  Set Rent Amount
                </h4>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                        Total Rent (₹)
                      </label>
                      <input
                        type="number"
                        {...register('amount')}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                        placeholder="e.g. 15000"
                      />
                      {errors.amount && (
                        <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
                      )}
                    </div>

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
                      {configureRent.isPending ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Save Configuration'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Current Rent Card */}
            {currentRent ? (
              <div className="bg-white dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-850 p-6 rounded-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center">
                      <Home className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-950 dark:text-white text-sm">Current Month Rent</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Month: {currentRent.monthKey}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900 dark:text-white block">
                      {formatCurrency(currentRent.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Split between {currentRent.splitAmounts.length} members
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Split Details (Per Person)</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentRent.splitAmounts.map((split: any) => (
                      <div
                        key={split._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/40 dark:border-slate-850 text-xs"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {split.userId?.name || 'Roommate'}
                        </span>
                        <span className="font-bold text-slate-950 dark:text-white">
                          {formatCurrency(split.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 p-8 rounded-2xl text-center">
                <Home className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">No Rent Configured</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Rent has not been configured for this month yet. Ask group admin to set the monthly rent.
                </p>
              </div>
            )}
          </div>

          {/* Rent History Timeline */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <History className="w-4 h-4" />
              Rent History
            </h4>

            {rentHistory?.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No history recorded.</p>
            ) : (
              <div className="space-y-3">
                {rentHistory?.map((rent) => (
                  <div
                    key={rent._id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-slate-500 dark:text-slate-400">
                        <Calendar className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {rent.monthKey}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {rent.splitAmounts.length} splits
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(rent.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
