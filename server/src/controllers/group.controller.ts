import { Request, Response } from 'express';
import { groupService } from '../services/group.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/helpers';

export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const group = await groupService.createGroup(req.body, req.user!.userId);
  res.status(201).json(ApiResponse.created(group, 'Group created'));
});

export const getMyGroups = asyncHandler(async (req: Request, res: Response) => {
  const groups = await groupService.getUserGroups(req.user!.userId);
  res.json(ApiResponse.ok(groups));
});

export const getGroup = asyncHandler(async (req: Request, res: Response) => {
  const group = await groupService.getGroupById(req.params.groupId as string);
  res.json(ApiResponse.ok(group));
});

export const updateGroup = asyncHandler(async (req: Request, res: Response) => {
  const group = await groupService.updateGroup(req.params.groupId as string, req.body, req.user!.userId);
  res.json(ApiResponse.ok(group, 'Group updated'));
});

export const deleteGroup = asyncHandler(async (req: Request, res: Response) => {
  await groupService.deleteGroup(req.params.groupId as string);
  res.json(ApiResponse.ok(null, 'Group deleted'));
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const member = await groupService.addMember(req.params.groupId as string, req.body.email, req.user!.userId);
  res.status(201).json(ApiResponse.created(member, 'Member added'));
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  await groupService.removeMember(req.params.groupId as string, req.params.userId as string, req.user!.userId);
  res.json(ApiResponse.ok(null, 'Member removed'));
});

export const promoteMember = asyncHandler(async (req: Request, res: Response) => {
  await groupService.promoteMember(req.params.groupId as string, req.params.userId as string, req.user!.userId);
  res.json(ApiResponse.ok(null, 'Member promoted to admin'));
});

export const getMembers = asyncHandler(async (req: Request, res: Response) => {
  const members = await groupService.getGroupMembers(req.params.groupId as string);
  res.json(ApiResponse.ok(members));
});

export const createInvitation = asyncHandler(async (req: Request, res: Response) => {
  const invitation = await groupService.createInvitation(req.params.groupId as string, req.body.email, req.user!.userId);
  res.status(201).json(ApiResponse.created(invitation, 'Invitation sent'));
});

export const acceptInvitation = asyncHandler(async (req: Request, res: Response) => {
  const result = await groupService.acceptInvitation(req.params.token as string, req.user!.userId);
  res.json(ApiResponse.ok(result, 'Invitation accepted'));
});

import Expense from '../models/Expense';
import Budget from '../models/Budget';
import { EXPENSE_CATEGORIES } from '../utils/constants';

export const getGroupCategories = asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;

  // Get all unique categories in expenses
  const expenseCategories = await Expense.distinct('category', { groupId, isDeleted: false });
  // Get all unique categories in budgets
  const budgetCategories = await Budget.distinct('category', { groupId });

  // Combine all categories
  const allCategoriesSet = new Set([
    ...EXPENSE_CATEGORIES,
    ...expenseCategories,
    ...budgetCategories
  ]);

  // Filter out any empty/null/undefined or "custom" values
  const categories = Array.from(allCategoriesSet)
    .filter((cat): cat is string => typeof cat === 'string' && cat.trim().length > 0 && cat !== 'custom')
    .sort();

  res.json(ApiResponse.ok(categories));
});
