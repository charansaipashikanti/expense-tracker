import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireGroupMember } from '../middleware/rbac';
import { requireRole } from '../middleware/rbac';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

router.use(authenticate);

// Group-level analytics
router.get('/group/:groupId/stats', requireGroupMember, analyticsController.getDashboardStats);
router.get('/group/:groupId/trend', requireGroupMember, analyticsController.getMonthlyTrend);
router.get('/group/:groupId/categories', requireGroupMember, analyticsController.getCategoryBreakdown);
router.get('/group/:groupId/contributions', requireGroupMember, analyticsController.getMemberContribution);
router.get('/group/:groupId/budget-utilization', requireGroupMember, analyticsController.getBudgetUtilization);
router.get('/group/:groupId/insights', requireGroupMember, analyticsController.getInsights);

// System-level analytics (super admin only)
router.get('/system', requireRole('superadmin'), analyticsController.getSystemAnalytics);

export default router;
