import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from './api';
import type { CreateGroupRequest, UpdateGroupRequest } from './api';
import { toast } from 'sonner';

export const groupsKeys = {
  all: ['groups'] as const,
  lists: () => [...groupsKeys.all, 'list'] as const,
  details: (id: string) => [...groupsKeys.all, 'detail', id] as const,
  members: (groupId: string) => [...groupsKeys.all, 'members', groupId] as const,
  categories: (groupId: string) => [...groupsKeys.all, 'categories', groupId] as const,
};

export function useMyGroups() {
  return useQuery({
    queryKey: groupsKeys.lists(),
    queryFn: groupsApi.getMyGroups,
  });
}

export function useGroupDetails(groupId: string) {
  return useQuery({
    queryKey: groupsKeys.details(groupId),
    queryFn: () => groupsApi.getGroup(groupId),
    enabled: !!groupId,
  });
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: groupsKeys.members(groupId),
    queryFn: () => groupsApi.getMembers(groupId),
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGroupRequest) => groupsApi.createGroup(data),
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      toast.success(`Group "${newGroup.name}" created successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create group');
    },
  });
}

export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateGroupRequest) => groupsApi.updateGroup(groupId, data),
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupsKeys.details(groupId) });
      toast.success('Group settings updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update group');
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      toast.success('Group deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    },
  });
}

export function useAddMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => groupsApi.addMember(groupId, email),
    onSuccess: (member) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.details(groupId) });
      queryClient.invalidateQueries({ queryKey: ['analytics', groupId] });
      queryClient.invalidateQueries({ queryKey: ['activity', groupId] });
      toast.success(`Added ${member.name} to the group!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add member');
    },
  });
}

export function useRemoveMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.details(groupId) });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', groupId] });
      queryClient.invalidateQueries({ queryKey: ['activity', groupId] });
      toast.success('Member removed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove member');
    },
  });
}

export function usePromoteMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => groupsApi.promoteMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupsKeys.details(groupId) });
      queryClient.invalidateQueries({ queryKey: ['activity', groupId] });
      toast.success('Member promoted to admin');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to promote member');
    },
  });
}

export function useCreateInvitation(groupId: string) {
  return useMutation({
    mutationFn: (email: string) => groupsApi.createInvitation(groupId, email),
    onSuccess: () => {
      toast.success('Invitation email sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    },
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => groupsApi.acceptInvitation(token),
    onSuccess: (invitation) => {
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      toast.success('Successfully joined the group!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to join group');
    },
  });
}

export function useGroupCategories(groupId: string) {
  return useQuery({
    queryKey: groupsKeys.categories(groupId),
    queryFn: () => groupsApi.getGroupCategories(groupId),
    enabled: !!groupId,
  });
}
