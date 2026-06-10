import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Plus, Layers, FolderOpen } from 'lucide-react';
import { useMyGroups, useGroupDetails } from '@/features/groups/hooks';
import { useGroupExpenses } from '@/features/expenses/hooks';
import { useAuth } from '@/features/auth/AuthContext';
import CustomSelect from '@/components/ui/CustomSelect';
import ExpenseList from '@/features/expenses/components/ExpenseList';
import AddExpenseModal from '@/features/expenses/components/AddExpenseModal';

export default function ExpensesPage() {
  const { user } = useAuth();
  const { data: groups, isLoading: isGroupsLoading } = useMyGroups();

  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => {
    return localStorage.getItem('roomsplit_active_group') || '';
  });

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

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

  const { data: groupData, isLoading: isGroupLoading } = useGroupDetails(selectedGroupId);
  const { data: expensesData, isLoading: isExpensesLoading } = useGroupExpenses(selectedGroupId, { limit: 100 });

  const isLoading = isGroupsLoading || isGroupLoading || isExpensesLoading;

  if (isGroupsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 skeleton rounded" />
        <div className="h-40 skeleton rounded-2xl w-full" />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <FolderOpen className="w-12 h-12 text-slate-350 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">No Groups Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          Create or join a room group first under the Groups tab to begin logging and splitting expenses.
        </p>
      </div>
    );
  }

  const groupMembers = groupData?.members || [];
  const myMemberRecord = groupMembers.find((m: any) => m.user?._id === user?._id);
  const isAdmin = myMemberRecord?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-brand-500" />
            Room Expenses
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track and split roommate invoices and groceries
          </p>
        </div>

        {/* Configuration switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Room:
            </label>
            <CustomSelect
              value={selectedGroupId}
              onChange={handleGroupChange}
              options={groups.map((group) => ({
                value: group._id,
                label: group.name,
              }))}
              className="min-w-[180px]"
            />
          </div>

          {selectedGroupId && (
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="px-4 py-2 gradient-bg text-white text-xs font-bold rounded-xl hover:opacity-95 transition-all flex items-center gap-1.5 shadow-md shadow-brand-500/15"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 skeleton rounded-xl w-full" />
          ))}
        </div>
      ) : (
        selectedGroupId && (
          <ExpenseList
            groupId={selectedGroupId}
            expenses={expensesData?.items || []}
            members={groupMembers}
            currentUserId={user?._id || ''}
            isAdmin={isAdmin}
          />
        )
      )}

      {selectedGroupId && groupMembers.length > 0 && (
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          groupId={selectedGroupId}
          members={groupMembers}
        />
      )}
    </div>
  );
}
