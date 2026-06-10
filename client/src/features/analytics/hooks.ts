import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from './api';

export const analyticsKeys = {
  all: ['analytics'] as const,
  group: (groupId: string) => [...analyticsKeys.all, groupId] as const,
  stats: (groupId: string) => [...analyticsKeys.group(groupId), 'stats'] as const,
  trend: (groupId: string) => [...analyticsKeys.group(groupId), 'trend'] as const,
  categories: (groupId: string) => [...analyticsKeys.group(groupId), 'categories'] as const,
  contributions: (groupId: string) => [...analyticsKeys.group(groupId), 'contributions'] as const,
  budgetUtilization: (groupId: string) => [...analyticsKeys.group(groupId), 'budgetUtilization'] as const,
  insights: (groupId: string) => [...analyticsKeys.group(groupId), 'insights'] as const,
};

export function useGroupStats(groupId: string) {
  return useQuery({
    queryKey: analyticsKeys.stats(groupId),
    queryFn: () => analyticsApi.getStats(groupId),
    enabled: !!groupId,
  });
}

export function useGroupTrend(groupId: string) {
  return useQuery({
    queryKey: analyticsKeys.trend(groupId),
    queryFn: () => analyticsApi.getTrend(groupId),
    enabled: !!groupId,
  });
}

export function useGroupCategories(groupId: string) {
  return useQuery({
    queryKey: analyticsKeys.categories(groupId),
    queryFn: () => analyticsApi.getCategories(groupId),
    enabled: !!groupId,
  });
}

export function useGroupContributions(groupId: string) {
  return useQuery({
    queryKey: analyticsKeys.contributions(groupId),
    queryFn: () => analyticsApi.getContributions(groupId),
    enabled: !!groupId,
  });
}

export function useGroupBudgetUtilization(groupId: string) {
  return useQuery({
    queryKey: analyticsKeys.budgetUtilization(groupId),
    queryFn: () => analyticsApi.getBudgetUtilization(groupId),
    enabled: !!groupId,
  });
}

export function useGroupInsights(groupId: string) {
  return useQuery({
    queryKey: analyticsKeys.insights(groupId),
    queryFn: () => analyticsApi.getInsights(groupId),
    enabled: !!groupId,
  });
}
