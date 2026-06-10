import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settlementsApi } from './api';
import type { CreateSettlementRequest } from './api';
import { toast } from 'sonner';

export const settlementKeys = {
  all: ['settlements'] as const,
  lists: (groupId: string) => [...settlementKeys.all, 'list', groupId] as const,
};

export function useGroupSettlements(groupId: string) {
  return useQuery({
    queryKey: settlementKeys.lists(groupId),
    queryFn: () => settlementsApi.getGroupSettlements(groupId),
    enabled: !!groupId,
  });
}

export function useCreateSettlement(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSettlementRequest) => settlementsApi.createSettlement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settlementKeys.lists(groupId) });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'suggestions', groupId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', groupId] });
      queryClient.invalidateQueries({ queryKey: ['activity', groupId] });
      toast.success('Settlement recorded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record settlement');
    },
  });
}

export function useDeleteSettlement(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settlementId: string) => settlementsApi.deleteSettlement(settlementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settlementKeys.lists(groupId) });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'suggestions', groupId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', groupId] });
      queryClient.invalidateQueries({ queryKey: ['activity', groupId] });
      toast.success('Settlement deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete settlement');
    },
  });
}
