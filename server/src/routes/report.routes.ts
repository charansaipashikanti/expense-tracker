import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireGroupMember } from '../middleware/rbac';
import Expense from '../models/Expense';
import Settlement from '../models/Settlement';
import ActivityLog from '../models/ActivityLog';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/helpers';

const router = Router();
router.use(authenticate);

// Monthly report for a group
router.get('/group/:groupId/monthly', requireGroupMember, asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const monthKey = req.query.monthKey as string;

  if (!monthKey) {
    res.status(400).json({ success: false, message: 'monthKey is required' });
    return;
  }

  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const [expenses, settlements, activities] = await Promise.all([
    Expense.find({ groupId, monthKey, isDeleted: false })
      .populate('paidBy', 'name email')
      .sort({ date: -1 }),
    Settlement.find({ groupId, monthKey })
      .populate('paidBy', 'name email')
      .populate('paidTo', 'name email')
      .sort({ date: -1 }),
    ActivityLog.find({
      groupId,
      createdAt: { $gte: startDate, $lt: endDate },
    })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(50),
  ]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSettlements = settlements.reduce((sum, s) => sum + s.amount, 0);

  res.json(ApiResponse.ok({
    monthKey,
    totalExpenses,
    totalSettlements,
    expenseCount: expenses.length,
    expenses,
    settlements,
    activities,
  }));
}));

// Activity log for a group
router.get('/group/:groupId/activity', requireGroupMember, asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 30;
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    ActivityLog.find({ groupId: req.params.groupId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments({ groupId: req.params.groupId }),
  ]);

  res.json(ApiResponse.ok({ items: activities, total, page, limit }));
}));

export default router;
