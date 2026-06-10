import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireGroupRole, requireGroupMember } from '../middleware/rbac';
import Budget from '../models/Budget';
import ActivityLog from '../models/ActivityLog';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler, getMonthKey } from '../utils/helpers';

const router = Router();
router.use(authenticate);

// Set/update budget for a category
router.post('/group/:groupId', requireGroupRole('admin'), asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { category, amount, month, year } = req.body;
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  const budget = await Budget.findOneAndUpdate(
    { groupId, monthKey, category },
    { amount, month, year, monthKey, createdBy: req.user!.userId },
    { upsert: true, new: true, runValidators: true }
  );

  await ActivityLog.create({
    groupId, userId: req.user!.userId, action: 'budget_configured',
    details: `Set ${category} budget to ₹${amount} for ${monthKey}`,
    entityType: 'budget', entityId: budget._id,
  });

  res.status(201).json(ApiResponse.created(budget, 'Budget set'));
}));

// Bulk set budgets
router.post('/group/:groupId/bulk', requireGroupRole('admin'), asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { budgets, month, year } = req.body;
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  const results = await Promise.all(
    budgets.map(async (b: { category: string; amount: number }) => {
      return Budget.findOneAndUpdate(
        { groupId, monthKey, category: b.category },
        { amount: b.amount, month, year, monthKey, createdBy: req.user!.userId },
        { upsert: true, new: true, runValidators: true }
      );
    })
  );

  res.status(201).json(ApiResponse.created(results, 'Budgets set'));
}));

// Get budgets for a month
router.get('/group/:groupId', requireGroupMember, asyncHandler(async (req, res) => {
  const monthKey = (req.query.monthKey as string) || getMonthKey();
  const budgets = await Budget.find({ groupId: req.params.groupId, monthKey });
  res.json(ApiResponse.ok(budgets));
}));

export default router;
