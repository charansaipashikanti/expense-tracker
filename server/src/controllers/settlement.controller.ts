import { Request, Response } from 'express';
import { settlementService } from '../services/settlement.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/helpers';

export const createSettlement = asyncHandler(async (req: Request, res: Response) => {
  const settlement = await settlementService.createSettlement(req.body, req.user!.userId);
  res.status(201).json(ApiResponse.created(settlement, 'Settlement recorded'));
});

export const getSettlements = asyncHandler(async (req: Request, res: Response) => {
  const groupId = req.params.groupId as string;
  const { monthKey, userId, page, limit } = req.query;

  const settlements = await settlementService.getGroupSettlements(groupId, {
    monthKey: monthKey as string | undefined,
    userId: userId as string | undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  res.json(ApiResponse.ok(settlements));
});

export const deleteSettlement = asyncHandler(async (req: Request, res: Response) => {
  await settlementService.deleteSettlement(req.params.settlementId as string, req.user!.userId);
  res.json(ApiResponse.ok(null, 'Settlement deleted'));
});
