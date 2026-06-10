import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetsApi } from './api';
import type { SetBudgetRequest, BulkSetBudgetRequest } from './api';
import { toast } from 'sonner';

export const budgetKeys = {
  all: ['budgets'] as const,
  lists: (groupId: string, monthKey?: string) => [...budgetKeys.all, 'list', groupId, monthKey || 'current'] as const,
};

export function useGroupBudgets(groupId: string, monthKey?: string) {
  return useQuery({
    queryKey: budgetKeys.lists(groupId, monthKey),
    queryFn: () => budgetsApi.getBudgets(groupId, monthKey),
    enabled: !!groupId,
  });
}

import { groupsKeys } from '@/features/groups/hooks';

export function useSetBudget(groupId: string, monthKey?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SetBudgetRequest) => budgetsApi.setBudget(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists(groupId, monthKey) });
      queryClient.invalidateQueries({ queryKey: ['analytics', groupId] });
      queryClient.invalidateQueries({ queryKey: ['activity', groupId] });
      queryClient.invalidateQueries({ queryKey: groupsKeys.categories(groupId) });
      toast.success('Budget set successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set budget');
    },
  });
}

export function useBulkSetBudgets(groupId: string, monthKey?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkSetBudgetRequest) => budgetsApi.bulkSetBudgets(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists(groupId, monthKey) });
      queryClient.invalidateQueries({ queryKey: ['analytics', groupId] });
      queryClient.invalidateQueries({ queryKey: ['activity', groupId] });
      queryClient.invalidateQueries({ queryKey: groupsKeys.categories(groupId) });
      toast.success('Budgets updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to bulk-set budgets');
    },
  });
}
