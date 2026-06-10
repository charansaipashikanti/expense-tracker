import { Request, Response } from 'express';
import { expenseService } from '../services/expense.service';
import { balanceService } from '../services/balance.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/helpers';

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await expenseService.createExpense(req.body, req.user!.userId);
  res.status(201).json(ApiResponse.created(expense, 'Expense added'));
});

export const getExpenses = asyncHandler(async (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const { monthKey, category, paidBy, search, page, limit } = req.query;

  const expenses = await expenseService.getGroupExpenses(groupId, {
    monthKey: monthKey as string | undefined,
    category: category as string | undefined,
    paidBy: paidBy as string | undefined,
    search: search as string | undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  res.json(ApiResponse.ok(expenses));
});

export const getExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await expenseService.getExpenseById(req.params.expenseId as string);
  res.json(ApiResponse.ok(expense));
});

export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await expenseService.updateExpense(req.params.expenseId as string, req.body, req.user!.userId);
  res.json(ApiResponse.ok(expense, 'Expense updated'));
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  await expenseService.deleteExpense(req.params.expenseId as string, req.user!.userId);
  res.json(ApiResponse.ok(null, 'Expense deleted'));
});

export const getBalances = asyncHandler(async (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const monthKey = req.query.monthKey as string | undefined;
  const balances = await balanceService.calculateBalances(groupId, monthKey);
  res.json(ApiResponse.ok(balances));
});

export const getSettlementSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const monthKey = req.query.monthKey as string | undefined;
  const suggestions = await balanceService.getSettlementSuggestions(groupId, monthKey);
  res.json(ApiResponse.ok(suggestions));
});
