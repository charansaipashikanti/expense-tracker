import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rentApi } from './api';
import type { ConfigureRentRequest } from './api';
import { toast } from 'sonner';

export const rentKeys = {
  all: ['rent'] as const,
  history: (groupId: string) => [...rentKeys.all, 'history', groupId] as const,
  current: (groupId: string) => [...rentKeys.all, 'current', groupId] as const,
};

export function useRentHistory(groupId: string) {
  return useQuery({
    queryKey: rentKeys.history(groupId),
    queryFn: () => rentApi.getRentHistory(groupId),
    enabled: !!groupId,
  });
}

export function useCurrentRent(groupId: string) {
  return useQuery({
    queryKey: rentKeys.current(groupId),
    queryFn: () => rentApi.getCurrentRent(groupId),
    enabled: !!groupId,
  });
}

export function useConfigureRent(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfigureRentRequest) => rentApi.configureRent(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rentKeys.history(groupId) });
      queryClient.invalidateQueries({ queryKey: rentKeys.current(groupId) });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['analytics', groupId] });
      queryClient.invalidateQueries({ queryKey: ['activity', groupId] });
      toast.success('Rent configured successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to configure rent');
    },
  });
}
