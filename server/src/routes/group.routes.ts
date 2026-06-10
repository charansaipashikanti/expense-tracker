import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireGroupRole, requireGroupMember } from '../middleware/rbac';
import * as groupController from '../controllers/group.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Group CRUD
router.post('/', groupController.createGroup);
router.get('/', groupController.getMyGroups);
router.get('/:groupId', requireGroupMember, groupController.getGroup);
router.patch('/:groupId', requireGroupRole('admin'), groupController.updateGroup);
router.delete('/:groupId', requireGroupRole('admin'), groupController.deleteGroup);

// Member management
router.get('/:groupId/members', requireGroupMember, groupController.getMembers);
router.get('/:groupId/categories', requireGroupMember, groupController.getGroupCategories);
router.post('/:groupId/members', requireGroupRole('admin'), groupController.addMember);
router.delete('/:groupId/members/:userId', requireGroupRole('admin'), groupController.removeMember);
router.patch('/:groupId/members/:userId/promote', requireGroupRole('admin'), groupController.promoteMember);

// Invitations
router.post('/:groupId/invite', requireGroupRole('admin'), groupController.createInvitation);
router.post('/invite/:token/accept', groupController.acceptInvitation);

export default router;
