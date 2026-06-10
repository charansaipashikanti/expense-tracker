import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireGroupMember } from '../middleware/rbac';
import * as settlementController from '../controllers/settlement.controller';

const router = Router();

router.use(authenticate);

router.post('/', settlementController.createSettlement);
router.get('/group/:groupId', requireGroupMember, settlementController.getSettlements);
router.delete('/:settlementId', settlementController.deleteSettlement);

export default router;
