import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireGroupMember } from '../middleware/rbac';
import * as expenseController from '../controllers/expense.controller';

const router = Router();

router.use(authenticate);

// Expense CRUD
router.post('/', expenseController.createExpense);
router.get('/group/:groupId', requireGroupMember, expenseController.getExpenses);
router.get('/:expenseId', expenseController.getExpense);
router.patch('/:expenseId', expenseController.updateExpense);
router.delete('/:expenseId', expenseController.deleteExpense);

// Balance & Settlement Suggestions
router.get('/group/:groupId/balances', requireGroupMember, expenseController.getBalances);
router.get('/group/:groupId/settlement-suggestions', requireGroupMember, expenseController.getSettlementSuggestions);

export default router;
