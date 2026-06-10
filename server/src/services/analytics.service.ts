import mongoose from 'mongoose';
import Expense from '../models/Expense';
import ExpenseSplit from '../models/ExpenseSplit';
import Settlement from '../models/Settlement';
import Budget from '../models/Budget';
import MonthlyRent from '../models/MonthlyRent';
import GroupMember from '../models/GroupMember';
import Group from '../models/Group';
import User from '../models/User';
import { getMonthKey } from '../utils/helpers';

class AnalyticsService {
  /**
   * Get dashboard stats for a group
   */
  async getDashboardStats(groupId: string) {
    const currentMonthKey = getMonthKey();
    const groupObjectId = new mongoose.Types.ObjectId(groupId);

    // Total expenses this month
    const monthExpenses = await Expense.aggregate([
      { $match: { groupId: groupObjectId, monthKey: currentMonthKey, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalExpenses = monthExpenses[0]?.total || 0;

    // Budget for this month
    const budgets = await Budget.find({ groupId, monthKey: currentMonthKey });
    const currentMonthBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const budgetRemaining = currentMonthBudget - totalExpenses;

    // Pending settlements count
    // (this is a simplified version — in production, use balance service)
    const pendingSettlements = 0; // Will be calculated from balance engine

    // Monthly rent
    const rent = await MonthlyRent.findOne({ groupId, monthKey: currentMonthKey });
    const monthlyRent = rent?.amount || 0;

    // Member count
    const memberCount = await GroupMember.countDocuments({ groupId, isActive: true });

    return {
      totalExpenses,
      currentMonthBudget,
      budgetRemaining,
      pendingSettlements,
      monthlyRent,
      memberCount,
    };
  }

  /**
   * Monthly expense trend (last 6 months)
   */
  async getMonthlyTrend(groupId: string, months = 6) {
    const now = new Date();
    const monthKeys: string[] = [];
    const groupObjectId = new mongoose.Types.ObjectId(groupId);

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(getMonthKey(d));
    }

    const result = await Promise.all(
      monthKeys.map(async (monthKey) => {
        const agg = await Expense.aggregate([
          { $match: { groupId: groupObjectId, monthKey, isDeleted: false } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return {
          month: monthKey,
          amount: agg[0]?.total || 0,
        };
      })
    );

    return result;
  }

  /**
   * Category breakdown for a month
   */
  async getCategoryBreakdown(groupId: string, monthKey?: string) {
    const currentMonthKey = monthKey || getMonthKey();
    const groupObjectId = new mongoose.Types.ObjectId(groupId);

    const breakdown = await Expense.aggregate([
      { $match: { groupId: groupObjectId, monthKey: currentMonthKey, isDeleted: false } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);

    const grandTotal = breakdown.reduce((sum, item) => sum + item.total, 0);

    return breakdown.map((item) => ({
      category: item._id,
      amount: item.total,
      percentage: grandTotal > 0 ? Math.round((item.total / grandTotal) * 10000) / 100 : 0,
    }));
  }

  /**
   * Member contribution breakdown
   */
  async getMemberContribution(groupId: string, monthKey?: string) {
    const currentMonthKey = monthKey || getMonthKey();
    const groupObjectId = new mongoose.Types.ObjectId(groupId);

    const contributions = await Expense.aggregate([
      { $match: { groupId: groupObjectId, monthKey: currentMonthKey, isDeleted: false } },
      { $group: { _id: '$paidBy', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    // Populate user details
    const result = await Promise.all(
      contributions.map(async (c) => {
        const user = await User.findById(c._id).select('name email avatar');
        return {
          userId: c._id,
          userName: user?.name || 'Unknown',
          totalPaid: c.total,
          expenseCount: c.count,
        };
      })
    );

    return result;
  }

  /**
   * Budget utilization for a month
   */
  async getBudgetUtilization(groupId: string, monthKey?: string) {
    const currentMonthKey = monthKey || getMonthKey();
    const groupObjectId = new mongoose.Types.ObjectId(groupId);

    const budgets = await Budget.find({ groupId, monthKey: currentMonthKey });

    // Get actual spending per category
    const spending = await Expense.aggregate([
      { $match: { groupId: groupObjectId, monthKey: currentMonthKey, isDeleted: false } },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } },
    ]);

    const spendingMap = new Map(spending.map((s) => [s._id, s.spent]));

    return budgets.map((budget) => ({
      category: budget.category,
      budget: budget.amount,
      spent: spendingMap.get(budget.category) || 0,
      remaining: budget.amount - (spendingMap.get(budget.category) || 0),
      percentage: budget.amount > 0
        ? Math.round(((spendingMap.get(budget.category) || 0) / budget.amount) * 100)
        : 0,
      isExceeded: (spendingMap.get(budget.category) || 0) > budget.amount,
    }));
  }

  /**
   * Generate insights
   */
  async getInsights(groupId: string) {
    const currentMonthKey = getMonthKey();
    const prevDate = new Date();
    prevDate.setDate(1);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonthKey = getMonthKey(prevDate);
    const groupObjectId = new mongoose.Types.ObjectId(groupId);

    const insights: string[] = [];

    // Compare total expenses
    const [currentAgg, prevAgg] = await Promise.all([
      Expense.aggregate([
        { $match: { groupId: groupObjectId, monthKey: currentMonthKey, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Expense.aggregate([
        { $match: { groupId: groupObjectId, monthKey: prevMonthKey, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const currentTotal = currentAgg[0]?.total || 0;
    const prevTotal = prevAgg[0]?.total || 0;

    if (prevTotal > 0 && currentTotal > 0) {
      const change = ((currentTotal - prevTotal) / prevTotal) * 100;
      if (change > 0) {
        insights.push(`Expenses increased by ${Math.round(change)}% compared to last month.`);
      } else if (change < 0) {
        insights.push(`Expenses decreased by ${Math.round(Math.abs(change))}% compared to last month. Great job! 🎉`);
      }
    }

    // Budget alerts
    const budgetUtil = await this.getBudgetUtilization(groupId);
    const exceeded = budgetUtil.filter((b) => b.isExceeded);
    if (exceeded.length > 0) {
      const categories = exceeded.map((b) => b.category).join(', ');
      insights.push(`Budget exceeded for: ${categories}`);
    }

    // Top category
    const breakdown = await this.getCategoryBreakdown(groupId);
    if (breakdown.length > 0) {
      insights.push(`Top spending category: ${breakdown[0].category} (${breakdown[0].percentage}%)`);
    }

    return insights;
  }

  /**
   * Admin-level system analytics
   */
  async getSystemAnalytics() {
    const [totalUsers, totalGroups, totalExpenses] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Group.countDocuments({ isActive: true }),
      Expense.countDocuments({ isDeleted: false }),
    ]);

    const currentMonthKey = getMonthKey();
    const activeUsersThisMonth = await Expense.distinct('paidBy', {
      monthKey: currentMonthKey,
      isDeleted: false,
    });

    return {
      totalUsers,
      totalGroups,
      totalExpenses,
      activeUsersThisMonth: activeUsersThisMonth.length,
    };
  }
}

export const analyticsService = new AnalyticsService();
