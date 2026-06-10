import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from './api';
import { toast } from 'sonner';

export const adminKeys = {
  all: ['admin'] as const,
  users: (page: number, limit: number) => [...adminKeys.all, 'users', page, limit] as const,
  groups: (page: number, limit: number) => [...adminKeys.all, 'groups', page, limit] as const,
  analytics: () => [...adminKeys.all, 'analytics'] as const,
};

export function useAdminUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: adminKeys.users(page, limit),
    queryFn: () => adminApi.getUsers(page, limit),
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.toggleUserStatus(userId),
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      toast.success(`User "${user.name}" status updated to ${user.isActive ? 'Active' : 'Inactive'}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    },
  });
}

export function useAdminGroups(page = 1, limit = 20) {
  return useQuery({
    queryKey: adminKeys.groups(page, limit),
    queryFn: () => adminApi.getGroups(page, limit),
  });
}

export function useDeactivateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => adminApi.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      toast.success('Group deactivated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate group');
    },
  });
}

export function useSystemAnalytics() {
  return useQuery({
    queryKey: adminKeys.analytics(),
    queryFn: adminApi.getSystemAnalytics,
  });
}
