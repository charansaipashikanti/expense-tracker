import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Receipt,
  ArrowLeftRight,
  Home,
  CreditCard,
  Settings,
  Plus,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useGroupDetails } from '@/features/groups/hooks';
import { useGroupExpenses } from '@/features/expenses/hooks';
import { useAuth } from '@/features/auth/AuthContext';
import MemberList from '@/features/groups/components/MemberList';
import ExpenseList from '@/features/expenses/components/ExpenseList';
import BalanceView from '@/features/groups/components/BalanceView';
import RentView from '@/features/rent/components/RentView';
import BudgetView from '@/features/budgets/components/BudgetView';
import AddExpenseModal from '@/features/expenses/components/AddExpenseModal';

type TabType = 'expenses' | 'balances' | 'rent' | 'budgets' | 'members';

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  const activeTab = (searchParams.get('tab') as TabType) || 'expenses';
  const setActiveTab = (tab: TabType) => {
    setSearchParams({ tab });
  };
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Group metadata & members queries
  const { data: groupData, isLoading: isGroupLoading, error: groupError } = useGroupDetails(groupId || '');

  // Group expenses queries
  const { data: expensesData, isLoading: isExpensesLoading } = useGroupExpenses(groupId || '', { limit: 100 });

  const isLoading = isGroupLoading || isExpensesLoading;

  if (groupError) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Group Not Found</h3>
        <p className="text-sm text-slate-500 mt-1">
          You might not have permission or this group has been deactivated.
        </p>
        <button
          onClick={() => navigate('/groups')}
          className="mt-4 px-4 py-2 border border-slate-200 dark:border-slate-800 text-sm font-semibold rounded-xl"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  if (isLoading || !groupData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 skeleton rounded" />
          <div className="h-6 w-48 skeleton rounded" />
        </div>
        <div className="h-40 skeleton rounded-2xl w-full" />
        <div className="h-96 skeleton rounded-2xl w-full" />
      </div>
    );
  }

  // Check group authorization
  const groupMembers = groupData.members || [];
  const myMemberRecord = groupMembers.find((m: any) => m.user?._id === user?._id);
  const isAdmin = myMemberRecord?.role === 'admin' || user?.role === 'superadmin';

  const tabItems: { value: TabType; label: string; icon: any }[] = [
    { value: 'expenses', label: 'Expenses', icon: Receipt },
    { value: 'balances', label: 'Balances', icon: ArrowLeftRight },
    { value: 'rent', label: 'Rent', icon: Home },
    { value: 'budgets', label: 'Budgets', icon: CreditCard },
    { value: 'members', label: 'Members', icon: Users },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumbs / Back */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <button
          onClick={() => navigate('/groups')}
          className="hover:text-brand-500 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Groups
        </button>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-600 dark:text-slate-350">{groupData.name}</span>
      </div>

      {/* Group Details Header Banner */}
      <div className="bg-white dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{groupData.name}</h1>
            {groupData.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                {groupData.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
              <span>
                {groupMembers.length} active roommate{groupMembers.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {activeTab === 'expenses' && (
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="self-start md:self-auto px-5 py-3 gradient-bg text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 shadow-lg shadow-brand-500/25"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          )}
        </div>

        {/* Decorative background visual */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl translate-x-10 -translate-y-10" />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-850 overflow-x-auto no-scrollbar gap-6">
        {tabItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;

          return (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={`py-3.5 border-b-2 font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap relative ${
                isActive
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 dark:bg-brand-400"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panel Content */}
      <div className="min-h-[350px]">
        {activeTab === 'expenses' && (
          <ExpenseList
            groupId={groupId || ''}
            expenses={expensesData?.items || []}
            members={groupMembers}
            currentUserId={user?._id || ''}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'balances' && (
          <BalanceView
            groupId={groupId || ''}
            members={groupMembers}
            currentUserId={user?._id || ''}
          />
        )}

        {activeTab === 'rent' && (
          <RentView
            groupId={groupId || ''}
            members={groupMembers}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetView
            groupId={groupId || ''}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'members' && (
          <MemberList
            groupId={groupId || ''}
            members={groupMembers}
            isAdmin={isAdmin}
            currentUserId={user?._id || ''}
          />
        )}
      </div>

      {/* Add Expense Dialog */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        groupId={groupId || ''}
        members={groupMembers}
      />
    </div>
  );
}
