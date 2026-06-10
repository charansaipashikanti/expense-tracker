import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireGroupRole, requireGroupMember } from '../middleware/rbac';
import MonthlyRent from '../models/MonthlyRent';
import GroupMember from '../models/GroupMember';
import ActivityLog from '../models/ActivityLog';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler, getMonthKey } from '../utils/helpers';
import { ApiError } from '../utils/ApiError';

const router = Router();
router.use(authenticate);

// Configure monthly rent
router.post('/group/:groupId', requireGroupRole('admin'), asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { amount, month, year } = req.body;
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  // Get active members
  const members = await GroupMember.find({ groupId, isActive: true });
  const perPerson = Math.round((amount / members.length) * 100) / 100;

  const splitAmounts = members.map((m) => ({
    userId: m.userId,
    amount: perPerson,
  }));

  const rent = await MonthlyRent.findOneAndUpdate(
    { groupId, monthKey },
    { amount, month, year, monthKey, splitAmounts, createdBy: req.user!.userId },
    { upsert: true, new: true, runValidators: true }
  );

  await ActivityLog.create({
    groupId, userId: req.user!.userId, action: 'rent_configured',
    details: `Set rent to ₹${amount} for ${monthKey}`,
    entityType: 'rent', entityId: rent._id,
  });

  res.status(201).json(ApiResponse.created(rent, 'Rent configured'));
}));

// Get rent history
router.get('/group/:groupId', requireGroupMember, asyncHandler(async (req, res) => {
  const rents = await MonthlyRent.find({ groupId: req.params.groupId })
    .sort({ year: -1, month: -1 })
    .populate('splitAmounts.userId', 'name email');
  res.json(ApiResponse.ok(rents));
}));

// Get current month rent
router.get('/group/:groupId/current', requireGroupMember, asyncHandler(async (req, res) => {
  const monthKey = getMonthKey();
  const rent = await MonthlyRent.findOne({ groupId: req.params.groupId, monthKey })
    .populate('splitAmounts.userId', 'name email');
  res.json(ApiResponse.ok(rent));
}));

export default router;
