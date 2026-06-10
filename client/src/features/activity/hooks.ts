import { useQuery } from '@tanstack/react-query';
import { activityApi } from './api';

export const activityKeys = {
  all: ['activity'] as const,
  group: (groupId: string) => [...activityKeys.all, groupId] as const,
  lists: (groupId: string) => [...activityKeys.group(groupId), 'list'] as const,
};

export function useGroupActivity(groupId: string, page = 1, limit = 30) {
  return useQuery({
    queryKey: [...activityKeys.lists(groupId), page, limit],
    queryFn: () => activityApi.getGroupActivity(groupId, page, limit),
    enabled: !!groupId,
  });
}
