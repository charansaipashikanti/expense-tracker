import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Receipt, Calendar, User, ArrowDownRight, ArrowUpRight, Trash2, Filter, FileText, Upload, Eye, Loader2, ChevronDown, Check } from 'lucide-react';
import type { Expense, GroupMember } from '@/types';
import { useDeleteExpense } from '../hooks';
import { formatCurrency } from '@/lib/utils';
import { useUploadReceipt, useDeleteReceipt } from '@/features/receipts/hooks';

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getPaidById = (paidBy: any): string => {
  if (typeof paidBy === 'object' && paidBy !== null) {
    return paidBy._id || '';
  }
  return paidBy || '';
};

import CustomSelect from '@/components/ui/CustomSelect';

interface Props {
  groupId: string;
  expenses: Expense[];
  members: GroupMember[];
  currentUserId: string;
  isAdmin: boolean;
}

export default function ExpenseList({ groupId, expenses, members, currentUserId, isAdmin }: Props) {
  const deleteExpense = useDeleteExpense(groupId);
  const uploadReceipt = useUploadReceipt(groupId);
  const deleteReceipt = useDeleteReceipt(groupId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [paidBy, setPaidBy] = useState('');

  const handleDelete = async (e: React.MouseEvent, expenseId: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteExpense.mutateAsync(expenseId);
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch = exp.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || exp.category === category;
    const matchesPaidBy = !paidBy || getPaidById(exp.paidBy) === paidBy;
    return matchesSearch && matchesCategory && matchesPaidBy;
  });

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      rent: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
      groceries: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
      electricity: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
      internet: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
      gas: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
      water: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400',
    };
    return colors[cat] || 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <CustomSelect
            value={category}
            onChange={setCategory}
            options={[
              { value: '', label: 'Categories' },
              ...Array.from(new Set(expenses.map(e => e.category))).map(cat => ({
                value: cat,
                label: cat.charAt(0).toUpperCase() + cat.slice(1),
              }))
            ]}
            placeholder="Categories"
          />
          <CustomSelect
            value={paidBy}
            onChange={setPaidBy}
            options={[
              { value: '', label: 'Paid By' },
              ...members.map((m) => ({
                value: m.userId,
                label: m.user?.name || 'Unknown',
              }))
            ]}
            placeholder="Paid By"
          />
        </div>
      </div>

      {/* Expense Cards */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl">
          <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-semibold">No expenses found matching the criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((exp) => {
            const isExpanded = expandedId === exp._id;
            const paidByMember = members.find((m) => m.userId === getPaidById(exp.paidBy));
            const mySplit = exp.splits.find((s) => s.userId === currentUserId);
            const isPayer = getPaidById(exp.paidBy) === currentUserId;

            return (
              <div
                key={exp._id}
                onClick={() => setExpandedId(isExpanded ? null : exp._id)}
                className={`bg-white dark:bg-slate-800/40 border rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden group ${
                  isExpanded
                    ? 'border-brand-500/40 ring-1 ring-brand-500/10 shadow-lg'
                    : 'border-slate-200/60 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Category Icon tag */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 capitalize ${getCategoryColor(exp.category)}`}>
                      {exp.category.slice(0, 2)}
                    </div>

                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white text-sm block group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                        {exp.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1 text-slate-400 text-xs">
                        <span className="flex items-center gap-0.5 font-medium">
                          <User className="w-3.5 h-3.5" />
                          {paidByMember?.user?.name || 'Unknown'}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(exp.date).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing / Debts summary */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white text-base block">
                        {formatCurrency(exp.amount)}
                      </span>

                      {/* Display share details */}
                      {isPayer ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-end gap-0.5">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          You lent
                        </span>
                      ) : mySplit ? (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center justify-end gap-0.5">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          You owe {formatCurrency(mySplit.amount)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Not involved
                        </span>
                      )}
                    </div>

                    {/* Delete for creator or admin */}
                    {(isAdmin || getPaidById(exp.paidBy) === currentUserId) && (
                      <button
                        onClick={(e) => handleDelete(e, exp._id, exp.title)}
                        disabled={deleteExpense.isPending}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Split Details */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10"
                    >
                      <div className="p-4 space-y-3.5">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
                          <span>Split Breakdown ({exp.splitType})</span>
                          {exp.notes && (
                            <span className="normal-case font-medium text-slate-500 italic">
                              "{exp.notes}"
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {exp.splits.map((s) => {
                            const member = members.find((m) => m.userId === s.userId);
                            return (
                              <div
                                key={s._id}
                                className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 text-xs"
                              >
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {member?.user?.name || 'Unknown User'}
                                </span>
                                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                                  {s.percentage !== undefined && (
                                    <span className="text-[10px] text-slate-400 font-medium mr-1">
                                      ({s.percentage}%)
                                    </span>
                                  )}
                                  {s.quantity !== undefined && (
                                    <span className="text-[10px] text-slate-400 font-medium mr-1">
                                      ({s.quantity} share{s.quantity > 1 ? 's' : ''})
                                    </span>
                                  )}
                                  {formatCurrency(s.amount)}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Receipt Attachment Section */}
                        <div className="border-t border-slate-100 dark:border-slate-850 pt-4 mt-3">
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Receipt Attachment
                          </div>
                          {exp.receiptId ? (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-indigo-55/60 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
                                </div>
                                <div className="min-w-0 text-xs">
                                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                    {exp.receiptId.originalName || 'Receipt File'}
                                  </p>
                                  <p className="text-slate-400 mt-0.5">
                                    {formatBytes(exp.receiptId.size)} • {exp.receiptId.fileType.split('/')[1]?.toUpperCase()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <a
                                  href={exp.receiptId.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-slate-400 hover:text-brand-650 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                  title="View Receipt"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                                {(isAdmin || getPaidById(exp.paidBy) === currentUserId) && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (window.confirm('Are you sure you want to delete this receipt?')) {
                                        await deleteReceipt.mutateAsync(exp.receiptId!._id);
                                      }
                                    }}
                                    disabled={deleteReceipt.isPending}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Delete Receipt"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div>
                              {(isAdmin || getPaidById(exp.paidBy) === currentUserId) ? (
                                <div className="flex items-center gap-3">
                                  <label
                                    className="cursor-pointer px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 transition-all flex items-center gap-1.5"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {uploadReceipt.isPending ? (
                                      <Loader2 className="w-4.5 h-4.5 text-brand-500 animate-spin" />
                                    ) : (
                                      <Upload className="w-4.5 h-4.5 text-brand-500" />
                                    )}
                                    <span>{uploadReceipt.isPending ? 'Uploading...' : 'Upload Receipt'}</span>
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,application/pdf"
                                      className="hidden"
                                      onChange={async (e) => {
                                        e.stopPropagation();
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          await uploadReceipt.mutateAsync({ expenseId: exp._id, file });
                                        }
                                      }}
                                      disabled={uploadReceipt.isPending}
                                    />
                                  </label>
                                  <span className="text-[10px] text-slate-400 font-semibold">
                                    JPG, PNG or PDF (Max 5MB)
                                  </span>
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-400 italic">No receipt attached to this expense.</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
