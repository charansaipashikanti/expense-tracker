import { useQuery } from '@tanstack/react-query';
import { reportsApi } from './api';

export const reportKeys = {
  all: ['reports'] as const,
  monthly: (groupId: string, monthKey: string) => [...reportKeys.all, 'monthly', groupId, monthKey] as const,
};

export function useMonthlyReport(groupId: string, monthKey: string) {
  return useQuery({
    queryKey: reportKeys.monthly(groupId, monthKey),
    queryFn: () => reportsApi.getMonthlyReport(groupId, monthKey),
    enabled: !!groupId && !!monthKey,
  });
}
