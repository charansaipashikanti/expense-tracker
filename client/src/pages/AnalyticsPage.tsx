import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  PieChart,
  Users,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  TrendingDown,
  Activity,
  CreditCard
} from 'lucide-react';
import { useMyGroups } from '@/features/groups/hooks';
import CustomSelect from '@/components/ui/CustomSelect';
import {
  useGroupStats,
  useGroupTrend,
  useGroupCategories,
  useGroupContributions,
  useGroupBudgetUtilization,
  useGroupInsights
} from '@/features/analytics/hooks';
import { formatCurrency } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f43f5e', // Rose
];

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

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { data: groups, isLoading: isGroupsLoading } = useMyGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    return localStorage.getItem('roomsplit_active_group') || null;
  });

  // Default to the first group when groups load
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

  // Stats & Charts Queries
  const { data: stats, isLoading: isStatsLoading } = useGroupStats(selectedGroupId || '');
  const { data: trendData } = useGroupTrend(selectedGroupId || '');
  const { data: categoryData } = useGroupCategories(selectedGroupId || '');
  const { data: contributionData } = useGroupContributions(selectedGroupId || '');
  const { data: budgetUtil } = useGroupBudgetUtilization(selectedGroupId || '');
  const { data: insights } = useGroupInsights(selectedGroupId || '');

  if (isGroupsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 skeleton rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 skeleton rounded-2xl" />
          <div className="h-80 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto py-16 text-center"
      >
        <div className="w-20 h-20 bg-brand-50 dark:bg-brand-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-500/10">
          <PieChart className="w-10 h-10 text-brand-600 dark:text-brand-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
          No Groups Found
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Create or join a group first to view detailed spending analytics and trend charts.
        </p>
        <button
          onClick={() => navigate('/groups')}
          className="px-6 py-3 gradient-bg text-white font-bold rounded-xl shadow-lg hover:opacity-95 transition-all inline-flex items-center gap-1.5"
        >
          Go to Groups
          <ArrowRight className="w-4.5 h-4.5" />
        </button>
      </motion.div>
    );
  }

  // Format charts data safely
  const formattedCategoryData = categoryData?.map((item, idx) => ({
    name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
    value: item.amount,
    color: COLORS[idx % COLORS.length]
  })) || [];

  const formattedTrendData = trendData?.map((item) => {
    const [year, month] = item.month.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return {
      month: date.toLocaleDateString(undefined, { month: 'short' }),
      amount: item.amount,
    };
  }) || [];

  const formattedContributionData = contributionData?.map((item) => ({
    name: (item as any).userName || 'Unknown',
    amount: (item as any).totalPaid || 0,
  })) || [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <PieChart className="w-8 h-8 text-brand-500" />
            Spending Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5">
            Deep dive data visualizations and AI roommate spending insights
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

      {/* Main Grid: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Lg 2 Columns) */}
        <div className="bg-white dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Monthly Expense Trend</h3>
              <p className="text-xs text-slate-400">Total room spending over last 6 months</p>
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64">
            {formattedTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20">
                <p className="text-xs text-slate-400 font-semibold">No monthly expenses recorded yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedTrendData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                    formatter={(val) => [formatCurrency(Number(val), activeGroup?.currency), 'Spent']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTrend)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown (Pie Chart) */}
        <div className="bg-white dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Category Breakdown</h3>
              <p className="text-xs text-slate-400">Month-to-date breakdown</p>
            </div>
            <PieChart className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-64 relative flex items-center justify-center">
            {formattedCategoryData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20">
                <p className="text-xs text-slate-400 font-semibold">Add expenses to show category details</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={formattedCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {formattedCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                    formatter={(val) => [formatCurrency(Number(val), activeGroup?.currency), 'Total']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    iconType="circle"
                    formatter={(value, entry: any) => (
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-455 uppercase">
                        {value}
                      </span>
                    )}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Contributions Bar Chart */}
        <div className="bg-white dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Contributions</h3>
              <p className="text-xs text-slate-400">Total amount paid per roommate</p>
            </div>
            <Users className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-60 mt-4">
            {formattedContributionData.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20">
                <p className="text-xs text-slate-400 font-semibold">No roommate contributions yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedContributionData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                    formatter={(val) => [formatCurrency(Number(val), activeGroup?.currency), 'Paid']}
                  />
                  <Bar dataKey="amount" fill="#818cf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Budget utilization lists */}
        <div className="bg-white dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Budget Limits</h3>
              <p className="text-xs text-slate-400">Spending compared to limits</p>
            </div>
            <CreditCard className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
            {!budgetUtil || budgetUtil.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20">
                <p className="text-xs text-slate-400 font-semibold">No category budgets defined for this month</p>
              </div>
            ) : (
              budgetUtil.map((budget) => {
                const isExceeded = budget.spent > budget.budget;
                return (
                  <div key={budget.category} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 uppercase truncate max-w-[120px]">
                        {budget.category}
                      </span>
                      <span className="font-semibold text-slate-400">
                        <span className={`font-bold ${isExceeded ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
                          {formatCurrency(budget.spent, activeGroup?.currency)}
                        </span>
                        {' '}/ {formatCurrency(budget.budget, activeGroup?.currency)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isExceeded ? 'bg-rose-500' : 'bg-brand-500'
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Room Insights Panel */}
        <div className="bg-white dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Room Insights</h3>
              <p className="text-xs text-slate-400">Calculated trends & metrics</p>
            </div>
            <Sparkles className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
            {!insights || insights.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20">
                <p className="text-xs text-slate-400 font-semibold">Add more room logs to generate smart insights</p>
              </div>
            ) : (
              insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="flex gap-2.5 items-start p-3 bg-brand-50/30 dark:bg-slate-800/20 rounded-xl text-xs border border-brand-500/10"
                >
                  <Sparkles className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                    {insight}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
