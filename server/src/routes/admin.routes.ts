import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import User from '../models/User';
import Group from '../models/Group';
import { analyticsService } from '../services/analytics.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/helpers';

const router = Router();
router.use(authenticate);
router.use(requireRole('superadmin'));

// Get all users
router.get('/users', asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);

  res.json(ApiResponse.ok({ items: users, total, page, limit }));
}));

// Disable/enable user
router.patch('/users/:userId/toggle', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    res.status(404).json(ApiResponse.ok(null, 'User not found'));
    return;
  }
  user.isActive = !user.isActive;
  await user.save();
  res.json(ApiResponse.ok(user, `User ${user.isActive ? 'enabled' : 'disabled'}`));
}));

// Get all groups
router.get('/groups', asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [groups, total] = await Promise.all([
    Group.find().populate('createdBy', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Group.countDocuments(),
  ]);

  res.json(ApiResponse.ok({ items: groups, total, page, limit }));
}));

// Delete group
router.delete('/groups/:groupId', asyncHandler(async (req, res) => {
  await Group.findByIdAndUpdate(req.params.groupId, { isActive: false });
  res.json(ApiResponse.ok(null, 'Group deactivated'));
}));

// System analytics
router.get('/analytics', asyncHandler(async (req, res) => {
  const analytics = await analyticsService.getSystemAnalytics();
  res.json(ApiResponse.ok(analytics));
}));

export default router;
