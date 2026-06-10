import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Printer,
  Calendar,
  Layers,
  Receipt,
  ArrowLeftRight,
  TrendingUp,
  ChevronRight,
  Download,
  FolderOpen
} from 'lucide-react';
import { useMyGroups } from '@/features/groups/hooks';
import CustomSelect from '@/components/ui/CustomSelect';
import { useMonthlyReport } from '@/features/reports/hooks';
import { formatCurrency } from '@/lib/utils';

export default function ReportsPage() {
  const { data: groups, isLoading: isGroupsLoading } = useMyGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Generate last 6 months options
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Default selected group
  useEffect(() => {
    if (groups && groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0]._id);
    }
  }, [groups, selectedGroupId]);

  const activeGroup = groups?.find((g) => g._id === selectedGroupId);

  const { data: report, isLoading: isReportLoading } = useMonthlyReport(
    selectedGroupId || '',
    selectedMonth
  );

  const monthOptions = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - idx);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    return { key, label };
  });

  const handlePrint = () => {
    window.print();
  };

  if (isGroupsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 skeleton rounded" />
        <div className="h-40 skeleton rounded-2xl" />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <FolderOpen className="w-12 h-12 text-slate-350 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">No Groups Available</h3>
        <p className="text-xs text-slate-500 mt-1">
          Create a room group first to generate and view monthly PDF/Excel summary reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12 print:p-0 print:bg-white print:text-black">
      {/* Configuration Header - Hidden on Print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-brand-500" />
            Monthly Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Export and download print-optimized summaries of room expenses
          </p>
        </div>

        {/* Configurations */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Room:</span>
            <CustomSelect
              value={selectedGroupId || ''}
              onChange={(value) => setSelectedGroupId(value)}
              options={groups.map((group) => ({
                value: group._id,
                label: group.name,
              }))}
              className="min-w-[120px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Month:</span>
            <CustomSelect
              value={selectedMonth}
              onChange={(value) => setSelectedMonth(value)}
              options={monthOptions.map((opt) => ({
                value: opt.key,
                label: opt.label,
              }))}
              className="min-w-[160px]"
            />
          </div>

          {report && (
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-95 shadow-md shadow-brand-500/15"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print/PDF</span>
            </button>
          )}
        </div>
      </div>

      {isReportLoading ? (
        <div className="space-y-4">
          <div className="h-32 skeleton rounded-2xl" />
          <div className="h-64 skeleton rounded-2xl" />
        </div>
      ) : (
        report && (
          <div className="space-y-6 print:space-y-8">
            {/* Print Only Header */}
            <div className="hidden print:block border-b border-slate-300 pb-4">
              <h1 className="text-xl font-bold uppercase text-slate-900">RoomSplit Expense Report</h1>
              <p className="text-xs text-slate-500 mt-1">
                Room: {activeGroup?.name} • Month: {monthOptions.find(o => o.key === selectedMonth)?.label}
              </p>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 print:grid-cols-3">
              <div className="p-5 bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-850 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0 print:border">
                  <Receipt className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Expenses</span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1 block">
                    {formatCurrency(report.totalExpenses, activeGroup?.currency)}
                  </span>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-850 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 print:border">
                  <ArrowLeftRight className="w-5 h-5 text-emerald-650 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Settled</span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1 block">
                    {formatCurrency(report.totalSettlements, activeGroup?.currency)}
                  </span>
                </div>
              </div>

              <div className="p-5 bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-850 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0 print:border">
                  <TrendingUp className="w-5 h-5 text-violet-650 dark:text-violet-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transactions Count</span>
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1 block">
                    {report.expenseCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Expenses List table */}
            <div className="bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 print:border-none print:p-0">
              <h3 className="font-bold text-slate-950 dark:text-white text-sm uppercase tracking-wider mb-4 print:text-xs">
                Monthly Expenses Breakdown
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Description</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Paid By</th>
                      <th className="py-2.5">Split type</th>
                      <th className="py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                    {report.expenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-450 italic">
                          No expenses added in this month.
                        </td>
                      </tr>
                    ) : (
                      report.expenses.map((exp) => (
                        <tr key={exp._id} className="text-slate-700 dark:text-slate-350">
                          <td className="py-3 font-semibold">
                            {new Date(exp.date).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 font-bold text-slate-950 dark:text-white">{exp.title}</td>
                          <td className="py-3 uppercase tracking-wider text-[10px] font-bold text-brand-600 dark:text-brand-400">
                            {exp.category}
                          </td>
                          <td className="py-3 font-semibold">{exp.paidByUser?.name || (exp.paidBy as any)?.name}</td>
                          <td className="py-3 capitalize">{exp.splitType}</td>
                          <td className="py-3 text-right font-extrabold text-slate-950 dark:text-white">
                            {formatCurrency(exp.amount, activeGroup?.currency)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Settlements Table */}
            <div className="bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 print:border-none print:p-0">
              <h3 className="font-bold text-slate-950 dark:text-white text-sm uppercase tracking-wider mb-4 print:text-xs">
                Monthly Settlements logs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Paid By</th>
                      <th className="py-2.5">Paid To</th>
                      <th className="py-2.5">Notes</th>
                      <th className="py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                    {report.settlements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-450 italic">
                          No settlements recorded in this month.
                        </td>
                      </tr>
                    ) : (
                      report.settlements.map((set) => (
                        <tr key={set._id} className="text-slate-700 dark:text-slate-350">
                          <td className="py-3 font-semibold">
                            {new Date(set.date).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 font-bold text-slate-950 dark:text-white">
                            {set.paidByUser?.name || (set.paidBy as any)?.name}
                          </td>
                          <td className="py-3 font-bold text-slate-900 dark:text-white">
                            {set.paidToUser?.name || (set.paidTo as any)?.name}
                          </td>
                          <td className="py-3 italic text-slate-450">
                            {set.notes || 'Settle Debt'}
                          </td>
                          <td className="py-3 text-right font-extrabold text-emerald-600 dark:text-emerald-450">
                            {formatCurrency(set.amount, activeGroup?.currency)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activities summary */}
            <div className="bg-white dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 print:hidden">
              <h3 className="font-bold text-slate-950 dark:text-white text-sm uppercase tracking-wider mb-4">
                Recent Room Audit Log
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {report.activities.length === 0 ? (
                  <p className="text-xs text-slate-450 italic text-center py-4">No audit logs for this month.</p>
                ) : (
                  report.activities.map((act) => (
                    <div key={act._id} className="text-xs flex justify-between items-center py-1.5 border-b border-slate-50 dark:border-slate-850/50">
                      <span className="text-slate-600 dark:text-slate-350">
                        <span className="font-bold text-slate-800 dark:text-slate-200 mr-1">{(act.userId as any)?.name}</span>
                        {act.details}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {new Date(act.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
