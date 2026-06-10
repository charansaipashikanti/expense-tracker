import mongoose from 'mongoose';
import Expense, { IExpense } from '../models/Expense';
import ExpenseSplit from '../models/ExpenseSplit';
import GroupMember from '../models/GroupMember';
import MonthlyClosing from '../models/MonthlyClosing';
import ActivityLog from '../models/ActivityLog';
import { ApiError } from '../utils/ApiError';
import { getMonthKey } from '../utils/helpers';

interface SplitInput {
  userId: string;
  amount?: number;
  percentage?: number;
  quantity?: number;
}

interface CreateExpenseInput {
  groupId: string;
  title: string;
  amount: number;
  category: string;
  paidBy: string;
  splitType: string;
  date: string;
  notes?: string;
  isRecurring?: boolean;
  recurringDay?: number;
  splits: SplitInput[];
}

class ExpenseService {
  /**
   * Create a new expense with splits
   */
  async createExpense(data: CreateExpenseInput, userId: string): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const expenseDate = new Date(data.date);
      const now = new Date();
      expenseDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      const monthKey = getMonthKey(expenseDate);

      // Check if month is locked
      const monthLock = await MonthlyClosing.findOne({
        groupId: data.groupId,
        monthKey,
        isLocked: true,
      });
      if (monthLock) {
        throw ApiError.badRequest(`Month ${monthKey} is locked. No edits allowed.`);
      }

      // Calculate splits
      const calculatedSplits = this.calculateSplits(
        data.amount,
        data.splitType,
        data.splits
      );

      // Create expense
      const expense = await Expense.create(
        [{
          groupId: data.groupId,
          title: data.title,
          amount: data.amount,
          category: data.category,
          paidBy: data.paidBy,
          splitType: data.splitType,
          date: expenseDate,
          notes: data.notes,
          isRecurring: data.isRecurring || false,
          recurringDay: data.recurringDay,
          monthKey,
          createdBy: userId,
        }],
        { session }
      );

      // Create splits
      const splitDocs = calculatedSplits.map((split) => ({
        expenseId: expense[0]._id,
        userId: split.userId,
        amount: split.amount,
        percentage: split.percentage,
        quantity: split.quantity,
      }));
      await ExpenseSplit.insertMany(splitDocs, { session });

      // Activity log
      await ActivityLog.create(
        [{
          groupId: data.groupId,
          userId,
          action: 'expense_created',
          details: `Added "${data.title}" - ₹${data.amount}`,
          entityType: 'expense',
          entityId: expense[0]._id,
          metadata: { amount: data.amount, category: data.category },
        }],
        { session }
      );

      await session.commitTransaction();

      // Return with populated data
      const populated = await Expense.findById(expense[0]._id)
        .populate('paidBy', 'name email avatar')
        .populate('createdBy', 'name email');

      const splits = await ExpenseSplit.find({ expenseId: expense[0]._id })
        .populate('userId', 'name email avatar');

      return { ...populated!.toJSON(), splits };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Calculate split amounts based on split type
   */
  calculateSplits(
    totalAmount: number,
    splitType: string,
    splits: SplitInput[]
  ): SplitInput[] {
    switch (splitType) {
      case 'equal': {
        const perPerson = Math.round((totalAmount / splits.length) * 100) / 100;
        // Handle rounding — last person gets the remainder
        const remainder = totalAmount - perPerson * (splits.length - 1);
        return splits.map((split, i) => ({
          ...split,
          amount: i === splits.length - 1 ? Math.round(remainder * 100) / 100 : perPerson,
        }));
      }

      case 'percentage': {
        const totalPercentage = splits.reduce((sum, s) => sum + (s.percentage || 0), 0);
        if (Math.abs(totalPercentage - 100) > 0.01) {
          throw ApiError.badRequest('Percentages must add up to 100%');
        }
        return splits.map((split) => ({
          ...split,
          amount: Math.round((totalAmount * (split.percentage || 0)) / 100 * 100) / 100,
        }));
      }

      case 'quantity': {
        const totalQuantity = splits.reduce((sum, s) => sum + (s.quantity || 0), 0);
        if (totalQuantity === 0) {
          throw ApiError.badRequest('Total quantity must be greater than 0');
        }
        const pricePerUnit = totalAmount / totalQuantity;
        return splits.map((split) => ({
          ...split,
          amount: Math.round(pricePerUnit * (split.quantity || 0) * 100) / 100,
        }));
      }

      case 'exact': {
        const totalExact = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
        if (Math.abs(totalExact - totalAmount) > 0.01) {
          throw ApiError.badRequest(
            `Split amounts (₹${totalExact}) must equal total (₹${totalAmount})`
          );
        }
        return splits;
      }

      default:
        throw ApiError.badRequest(`Invalid split type: ${splitType}`);
    }
  }

  /**
   * Get expenses for a group with filters
   */
  async getGroupExpenses(
    groupId: string,
    filters: {
      monthKey?: string;
      category?: string;
      paidBy?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<any> {
    const query: any = { groupId, isDeleted: false };

    if (filters.monthKey) query.monthKey = filters.monthKey;
    if (filters.category) query.category = filters.category;
    if (filters.paidBy) query.paidBy = filters.paidBy;
    if (filters.search) {
      query.title = { $regex: filters.search, $options: 'i' };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .populate('paidBy', 'name email avatar')
        .populate('receiptId')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Expense.countDocuments(query),
    ]);

    // Attach splits
    const expenseIds = expenses.map((e) => e._id);
    const splits = await ExpenseSplit.find({
      expenseId: { $in: expenseIds },
    }).populate('userId', 'name email avatar');

    const expensesWithSplits = expenses.map((expense) => ({
      ...expense.toJSON(),
      splits: splits.filter(
        (s) => s.expenseId.toString() === expense._id.toString()
      ),
    }));

    return {
      items: expensesWithSplits,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single expense with splits
   */
  async getExpenseById(expenseId: string): Promise<any> {
    const expense = await Expense.findById(expenseId)
      .populate('paidBy', 'name email avatar')
      .populate('createdBy', 'name email')
      .populate('receiptId');

    if (!expense || expense.isDeleted) {
      throw ApiError.notFound('Expense not found');
    }

    const splits = await ExpenseSplit.find({ expenseId })
      .populate('userId', 'name email avatar');

    return { ...expense.toJSON(), splits };
  }

  /**
   * Update expense
   */
  async updateExpense(expenseId: string, data: Partial<CreateExpenseInput>, userId: string): Promise<any> {
    const expense = await Expense.findById(expenseId);
    if (!expense || expense.isDeleted) {
      throw ApiError.notFound('Expense not found');
    }

    // Check month lock
    const monthLock = await MonthlyClosing.findOne({
      groupId: expense.groupId,
      monthKey: expense.monthKey,
      isLocked: true,
    });
    if (monthLock) {
      throw ApiError.badRequest('This month is locked. No edits allowed.');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update expense
      if (data.title) expense.title = data.title;
      if (data.amount) expense.amount = data.amount;
      if (data.category) expense.category = data.category;
      if (data.paidBy) expense.paidBy = new mongoose.Types.ObjectId(data.paidBy);
      if (data.splitType) expense.splitType = data.splitType;
      if (data.date) {
        const dateObj = new Date(data.date);
        const now = new Date();
        dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        expense.date = dateObj;
        expense.monthKey = getMonthKey(dateObj);
      }
      if (data.notes !== undefined) expense.notes = data.notes;
      await expense.save({ session });

      // Recalculate splits if splits data is provided
      if (data.splits && data.splitType) {
        await ExpenseSplit.deleteMany({ expenseId }, { session });

        const calculatedSplits = this.calculateSplits(
          data.amount || expense.amount,
          data.splitType,
          data.splits
        );

        const splitDocs = calculatedSplits.map((split) => ({
          expenseId: expense._id,
          userId: split.userId,
          amount: split.amount,
          percentage: split.percentage,
          quantity: split.quantity,
        }));
        await ExpenseSplit.insertMany(splitDocs, { session });
      }

      await ActivityLog.create(
        [{
          groupId: expense.groupId,
          userId,
          action: 'expense_updated',
          details: `Updated "${expense.title}"`,
          entityType: 'expense',
          entityId: expense._id,
        }],
        { session }
      );

      await session.commitTransaction();
      return this.getExpenseById(expenseId);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Delete expense (soft)
   */
  async deleteExpense(expenseId: string, userId: string) {
    const expense = await Expense.findById(expenseId);
    if (!expense || expense.isDeleted) {
      throw ApiError.notFound('Expense not found');
    }

    expense.isDeleted = true;
    await expense.save();

    await ActivityLog.create({
      groupId: expense.groupId,
      userId,
      action: 'expense_deleted',
      details: `Deleted "${expense.title}" - ₹${expense.amount}`,
      entityType: 'expense',
      entityId: expense._id,
    });
  }
}

export const expenseService = new ExpenseService();
