import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import Notification from '../models/Notification';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/helpers';

const router = Router();
router.use(authenticate);

// Get my notifications
router.get('/', asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ userId: req.user!.userId }),
    Notification.countDocuments({ userId: req.user!.userId, isRead: false }),
  ]);

  res.json(ApiResponse.ok({ items: notifications, total, unreadCount, page, limit }));
}));

// Mark as read
router.patch('/:id/read', asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json(ApiResponse.ok(null, 'Marked as read'));
}));

// Mark all as read
router.patch('/read-all', asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user!.userId, isRead: false },
    { isRead: true }
  );
  res.json(ApiResponse.ok(null, 'All notifications marked as read'));
}));

export default router;
