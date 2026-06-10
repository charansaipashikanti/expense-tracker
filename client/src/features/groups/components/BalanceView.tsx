import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, TrendingUp, TrendingDown, HandCoins, Check, Award } from 'lucide-react';
import type { GroupMember } from '@/types';
import { useGroupBalances, useSettlementSuggestions } from '@/features/expenses/hooks';
import { formatCurrency } from '@/lib/utils';
import SettleUpModal from './SettleUpModal';

interface Props {
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
}

export default function BalanceView({ groupId, members, currentUserId }: Props) {
  const { data: balances, isLoading: isBalancesLoading } = useGroupBalances(groupId);
  const { data: suggestions, isLoading: isSuggestionsLoading } = useSettlementSuggestions(groupId);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState<{ paidBy: string; paidTo: string; amount: number } | null>(null);

  const handleOpenSettle = (paidBy: string, paidTo: string, amount: number) => {
    setPrefilledData({ paidBy, paidTo, amount });
    setIsSettleOpen(true);
  };

  const handleCloseSettle = () => {
    setPrefilledData(null);
    setIsSettleOpen(false);
  };

  const isLoading = isBalancesLoading || isSuggestionsLoading;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Balances & Settlements</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">View net balances and settle pending debts</p>
        </div>
        <button
          onClick={() => setIsSettleOpen(true)}
          className="px-4 py-2.5 gradient-bg text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/20"
        >
          <ArrowLeftRight className="w-4 h-4" />
          Settle Up
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-24 skeleton rounded-2xl w-full" />
          <div className="h-40 skeleton rounded-2xl w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Net Balances Column */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Roommate Balances</h4>
            <div className="space-y-3">
              {balances?.map((bal) => {
                const member = members.find((m) => m.userId === bal.userId);
                const isPositive = bal.netBalance > 0;
                const isZero = Math.abs(bal.netBalance) < 0.01;

                return (
                  <div
                    key={bal.userId}
                    className="bg-white dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-850 p-4 rounded-2xl flex items-center justify-between hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center font-bold text-white text-sm uppercase">
                        {member?.user?.name.slice(0, 2) || 'RM'}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-950 dark:text-white block text-sm">
                          {member?.user?.name || 'Unknown Roommate'}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Paid: {formatCurrency(bal.totalPaid)} • Shares: {formatCurrency(bal.totalOwed)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {isZero ? (
                        <span className="text-sm font-bold text-slate-400 dark:text-slate-500">
                          Settle Clean
                        </span>
                      ) : (
                        <div className="flex flex-col items-end">
                          <span className={`text-base font-bold flex items-center gap-0.5 ${
                            isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {isPositive ? '+' : ''}
                            {formatCurrency(bal.netBalance)}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 mt-0.5 ${
                            isPositive ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {isPositive ? 'gets back' : 'owes'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settlement Suggestions Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Suggested Settlements</h4>
            {suggestions?.length === 0 ? (
              <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 p-6 rounded-2xl text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-300">All settled up!</p>
                <p className="text-xs text-slate-400">No transactions needed to balance the sheet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions?.map((s, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-sm hover:shadow"
                  >
                    <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <span className="font-semibold text-slate-900 dark:text-white">{s.from.name}</span>
                      <span> owes </span>
                      <span className="font-semibold text-slate-900 dark:text-white">{s.to.name}</span>
                      <span className="block mt-1 font-bold text-base text-slate-950 dark:text-white">
                        {formatCurrency(s.amount)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenSettle(s.from._id, s.to._id, s.amount)}
                      className="w-full py-2 bg-slate-50 hover:bg-brand-50 hover:text-brand-600 dark:bg-slate-800 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <HandCoins className="w-3.5 h-3.5" />
                      Record Payment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settle Up Modal */}
      <SettleUpModal
        isOpen={isSettleOpen}
        onClose={handleCloseSettle}
        groupId={groupId}
        members={members}
        prefilled={prefilledData}
      />
    </div>
  );
}
