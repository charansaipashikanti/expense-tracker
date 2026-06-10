import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ArrowLeftRight,
  Home,
  PieChart,
  Wallet,
  ArrowRight,
  Plus,
  Info,
  Calendar,
  Layers,
  ChevronRight,
  FolderOpen,
  HandCoins,
  Check,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useMyGroups, useGroupDetails } from '@/features/groups/hooks';
import { useAuth } from '@/features/auth/AuthContext';
import CustomSelect from '@/components/ui/CustomSelect';
import { useGroupStats } from '@/features/analytics/hooks';
import { useSettlementSuggestions } from '@/features/expenses/hooks';
import { useGroupActivity } from '@/features/activity/hooks';
import { formatCurrency } from '@/lib/utils';
import AddExpenseModal from '@/features/expenses/components/AddExpenseModal';
import SettleUpModal from '@/features/groups/components/SettleUpModal';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: groups, isLoading: isGroupsLoading } = useMyGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    return localStorage.getItem('roomsplit_active_group') || null;
  });

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [prefilledSettleData, setPrefilledSettleData] = useState<{ paidBy: string; paidTo: string; amount: number } | null>(null);

  // Automatically default to the first group when groups load
  useEffect(() => {
    if (groups && groups.length > 0) {
      if (!selectedGroupId || !groups.some((g) => g._id === selectedGroupId)) {
        setSelectedGroupId(groups[0]._id);
        localStorage.setItem('roomsplit_active_group', groups[0]._id);
      }
    }
  }, [groups, selectedGroupId]);

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    localStorage.setItem('roomsplit_active_group', groupId);
  };

  const activeGroup = groups?.find((g) => g._id === selectedGroupId);

  // Stats & timeline queries
  const { data: stats, isLoading: isStatsLoading } = useGroupStats(selectedGroupId || '');
  const { data: suggestions, isLoading: isSuggestionsLoading } = useSettlementSuggestions(selectedGroupId || '');
  const { data: activityData } = useGroupActivity(selectedGroupId || '', 1, 6);
  const { data: groupData, isLoading: isGroupDetailLoading } = useGroupDetails(selectedGroupId || '');

  const groupMembers = groupData?.members || [];
  const pendingSettlementCount = suggestions?.length || 0;
  const isLoading = isGroupsLoading || isGroupDetailLoading;

  const handleOpenSettle = (paidBy: string, paidTo: string, amount: number) => {
    setPrefilledSettleData({ paidBy, paidTo, amount });
    setIsSettleOpen(true);
  };

  const handleCloseSettle = () => {
    setPrefilledSettleData(null);
    setIsSettleOpen(false);
  };

  if (isGroupsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 skeleton rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 skeleton rounded-2xl" />
          <div className="h-80 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  // Empty state if user has no groups at all
  if (!groups || groups.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto py-16 text-center"
      >
        <div className="w-20 h-20 bg-brand-50 dark:bg-brand-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-500/10 animate-pulse-soft">
          <Wallet className="w-10 h-10 text-brand-600 dark:text-brand-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
          Welcome to RoomSplit!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          It looks like you don't belong to any roommate groups yet. Create a group or ask your room admin to invite you via email to start tracking your room expenses.
        </p>
        <button
          onClick={() => navigate('/groups')}
          className="px-6 py-3 gradient-bg text-white font-bold rounded-xl shadow-lg shadow-brand-500/25 hover:opacity-95 transition-all inline-flex items-center gap-1.5"
        >
          Go to Groups
          <ArrowRight className="w-4.5 h-4.5" />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5">
            Real-time overview for your selected roommate room
          </p>
        </div>

        {/* Group Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Room:
          </label>
          <CustomSelect
            value={selectedGroupId || ''}
            onChange={handleGroupChange}
            options={groups.map((group) => ({
              value: group._id,
              label: group.name,
            }))}
            className="min-w-[200px]"
          />
        </div>
      </div>

      {/* Group Selector Catalog */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Layers className="w-4 h-4 text-slate-400" />
          <span>Select Room / Group Catalog</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {groups.map((group) => {
            const isSelected = group._id === selectedGroupId;
            return (
              <button
                key={group._id}
                onClick={() => handleGroupChange(group._id)}
                className={`text-left p-4 rounded-xl border transition-all flex items-center justify-between relative overflow-hidden group ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-500/5 shadow-sm'
                    : 'border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/30 hover:border-slate-350 dark:hover:border-slate-800'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <h3 className={`font-bold text-sm truncate ${
                    isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {group.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-semibold truncate">
                    {group.memberCount} roommate{group.memberCount > 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors flex-shrink-0 ${
                  isSelected ? 'text-brand-500' : ''
                }`} />
              </button>
            );
          })}
        </div>
      </div>

      {isStatsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
      ) : (
        stats && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {/* Stat: Total Expenses */}
            <motion.div
              variants={item}
              className="relative overflow-hidden bg-white dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 hover:shadow-lg hover:shadow-slate-200/30 dark:hover:shadow-slate-950/30 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Expenses</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
                    {formatCurrency(stats.totalExpenses, activeGroup?.currency)}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-400 block mt-2">
                    Spent this calendar month
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                  <Wallet className="w-5.5 h-5.5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>

            {/* Stat: Budget Remaining */}
            <motion.div
              variants={item}
              className="relative overflow-hidden bg-white dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 hover:shadow-lg hover:shadow-slate-200/30 dark:hover:shadow-slate-950/30 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Budget Status</p>
                  <p className={`text-2xl font-extrabold mt-2 tracking-tight ${
                    stats.budgetRemaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                  }`}>
                    {formatCurrency(stats.budgetRemaining, activeGroup?.currency)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {stats.budgetRemaining < 0 ? (
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">
                        OVER BUDGET
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {stats.currentMonthBudget > 0
                          ? `${Math.round(((stats.currentMonthBudget - stats.budgetRemaining) / stats.currentMonthBudget) * 100)}% Used`
                          : 'No Budget Set'}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${
                  stats.budgetRemaining < 0 ? 'from-rose-500 to-pink-650' : 'from-emerald-500 to-teal-600'
                } flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                  <PieChart className="w-5.5 h-5.5 text-white" />
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
                stats.budgetRemaining < 0 ? 'from-rose-500 to-pink-650' : 'from-emerald-500 to-teal-600'
              } opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </motion.div>

            {/* Stat: Rent Split */}
            <motion.div
              variants={item}
              className="relative overflow-hidden bg-white dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 hover:shadow-lg hover:shadow-slate-200/30 dark:hover:shadow-slate-950/30 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room Rent</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
                    {formatCurrency(stats.monthlyRent, activeGroup?.currency)}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-400 block mt-2">
                    Rent for this month
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
                  <Home className="w-5.5 h-5.5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>

            {/* Stat: Pending Settlements */}
            <motion.div
              variants={item}
              className="relative overflow-hidden bg-white dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 hover:shadow-lg hover:shadow-slate-200/30 dark:hover:shadow-slate-950/30 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Settlements</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
                    {pendingSettlementCount}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-400 block mt-2">
                    Pending roommate debts
                  </span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-pink-650 flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform duration-300">
                  <ArrowLeftRight className="w-5.5 h-5.5 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-650 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          </motion.div>
        )
      )}

      {/* Main Grid: Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns (Quick Actions & Suggested Settlements) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="bg-white dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Quick Actions</h3>
              <p className="text-xs text-slate-400">Common actions for managing roommate expenditures</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setIsAddExpenseOpen(true)}
                disabled={!selectedGroupId}
                className="p-4 bg-brand-50/50 hover:bg-brand-50 dark:bg-brand-500/5 dark:hover:bg-brand-500/10 border border-brand-100 dark:border-brand-500/10 rounded-2xl text-left transition-all hover:scale-[1.01] flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                  <Plus className="w-5.5 h-5.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    Add Expense
                  </span>
                  <span className="text-[10px] text-slate-450 block font-medium mt-0.5">
                    Log new roommate receipts
                  </span>
                </div>
              </button>

              <button
                onClick={() => setIsSettleOpen(true)}
                disabled={!selectedGroupId || groupMembers.length === 0}
                className="p-4 bg-indigo-50/50 hover:bg-indigo-50 dark:bg-indigo-500/5 dark:hover:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-550/10 rounded-2xl text-left transition-all hover:scale-[1.01] flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Settle Up Balance
                  </span>
                  <span className="text-[10px] text-slate-450 block font-medium mt-0.5">
                    Record payment settlements
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate('/budgets')}
                className="p-4 bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-500/5 dark:hover:bg-amber-500/10 border border-amber-100 dark:border-amber-500/10 rounded-2xl text-left transition-all hover:scale-[1.01] flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Set Budget Limits
                  </span>
                  <span className="text-[10px] text-slate-450 block font-medium mt-0.5">
                    Limit spending categories
                  </span>
                </div>
              </button>

              <button
                onClick={() => navigate('/analytics')}
                className="p-4 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-500/5 dark:hover:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl text-left transition-all hover:scale-[1.01] flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    View Charts & Analytics
                  </span>
                  <span className="text-[10px] text-slate-450 block font-medium mt-0.5">
                    Check interactive charts
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Suggested Settlements */}
          <div className="bg-white dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Suggested Settlements</h3>
              <p className="text-xs text-slate-400">Optimized transactions to clear outstanding roommates debts</p>
            </div>

            {isSuggestionsLoading ? (
              <div className="h-32 skeleton rounded-2xl w-full" />
            ) : suggestions?.length === 0 ? (
              <div className="bg-emerald-50/40 dark:bg-emerald-500/5 border border-emerald-100/60 dark:border-emerald-500/10 p-6 rounded-2xl text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-350">All settled up!</p>
                <p className="text-xs text-slate-400">No roommate transactions needed to balance the sheet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {suggestions?.map((s, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between gap-4 group"
                  >
                    <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <span className="font-bold text-slate-900 dark:text-white">{s.from.name}</span>
                      <span> owes </span>
                      <span className="font-bold text-slate-900 dark:text-white">{s.to.name}</span>
                      <span className="block mt-2 font-black text-xl text-slate-950 dark:text-white tracking-tight">
                        {formatCurrency(s.amount, activeGroup?.currency)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenSettle(s.from._id, s.to._id, s.amount)}
                      className="w-full py-2 bg-white dark:bg-slate-900 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:hover:text-brand-400 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm group-hover:shadow"
                    >
                      <HandCoins className="w-4 h-4" />
                      Record Payment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Section */}
        <div className="bg-white dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 h-fit space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Recent Activity</h3>
              <p className="text-xs text-slate-400">Audit logs for the selected room</p>
            </div>
            <button
              onClick={() => navigate(`/groups/${selectedGroupId}`)}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
            >
              Details
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            {!activityData || activityData.items.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50/20">
                <FolderOpen className="w-8 h-8 text-slate-350 dark:text-slate-750 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-semibold">No recent room actions found</p>
              </div>
            ) : (
              activityData.items.map((act) => (
                <div
                  key={act._id}
                  className="flex gap-3 items-start p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-all border border-transparent"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 leading-relaxed">
                      <span className="font-bold text-slate-900 dark:text-white mr-1">
                        {act.user?.name}
                      </span>
                      {act.details}
                    </p>
                    <span className="text-[10px] font-semibold text-slate-400 block mt-1">
                      {new Date(act.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedGroupId && isAddExpenseOpen && (
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          groupId={selectedGroupId}
          members={groupMembers}
        />
      )}

      {selectedGroupId && isSettleOpen && (
        <SettleUpModal
          isOpen={isSettleOpen}
          onClose={handleCloseSettle}
          groupId={selectedGroupId}
          members={groupMembers}
          prefilled={prefilledSettleData}
        />
      )}
    </div>
  );
}
