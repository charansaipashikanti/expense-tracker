import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/helpers';

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await analyticsService.getDashboardStats(req.params.groupId as string);
  res.json(ApiResponse.ok(stats));
});

export const getMonthlyTrend = asyncHandler(async (req: Request, res: Response) => {
  const months = req.query.months ? Number(req.query.months) : 6;
  const trend = await analyticsService.getMonthlyTrend(req.params.groupId as string, months);
  res.json(ApiResponse.ok(trend));
});

export const getCategoryBreakdown = asyncHandler(async (req: Request, res: Response) => {
  const breakdown = await analyticsService.getCategoryBreakdown(
    req.params.groupId as string,
    req.query.monthKey as string | undefined
  );
  res.json(ApiResponse.ok(breakdown));
});

export const getMemberContribution = asyncHandler(async (req: Request, res: Response) => {
  const contribution = await analyticsService.getMemberContribution(
    req.params.groupId as string,
    req.query.monthKey as string | undefined
  );
  res.json(ApiResponse.ok(contribution));
});

export const getBudgetUtilization = asyncHandler(async (req: Request, res: Response) => {
  const utilization = await analyticsService.getBudgetUtilization(
    req.params.groupId as string,
    req.query.monthKey as string | undefined
  );
  res.json(ApiResponse.ok(utilization));
});

export const getInsights = asyncHandler(async (req: Request, res: Response) => {
  const insights = await analyticsService.getInsights(req.params.groupId as string);
  res.json(ApiResponse.ok(insights));
});

export const getSystemAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const analytics = await analyticsService.getSystemAnalytics();
  res.json(ApiResponse.ok(analytics));
});
