import api from '@/lib/api';
import type { Group, GroupMember, ApiResponse, Invitation } from '@/types';

export interface CreateGroupRequest {
  name: string;
  description?: string;
  currency: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  currency?: string;
  settings?: {
    allowMembersToAddExpenses?: boolean;
  };
}

export const groupsApi = {
  getMyGroups: async (): Promise<Group[]> => {
    const response = await api.get<ApiResponse<Group[]>>('/groups');
    return response.data.data;
  },

  getGroup: async (groupId: string): Promise<Group & { members: GroupMember[], memberCount: number }> => {
    const response = await api.get<ApiResponse<Group & { members: GroupMember[], memberCount: number }>>(`/groups/${groupId}`);
    return response.data.data;
  },

  createGroup: async (data: CreateGroupRequest): Promise<Group> => {
    const response = await api.post<ApiResponse<Group>>('/groups', data);
    return response.data.data;
  },

  updateGroup: async (groupId: string, data: UpdateGroupRequest): Promise<Group> => {
    const response = await api.patch<ApiResponse<Group>>(`/groups/${groupId}`, data);
    return response.data.data;
  },

  deleteGroup: async (groupId: string): Promise<void> => {
    await api.delete(`/groups/${groupId}`);
  },

  getMembers: async (groupId: string): Promise<GroupMember[]> => {
    const response = await api.get<ApiResponse<GroupMember[]>>(`/groups/${groupId}/members`);
    return response.data.data;
  },

  addMember: async (groupId: string, email: string): Promise<{ userId: string; name: string; email: string }> => {
    const response = await api.post<ApiResponse<{ userId: string; name: string; email: string }>>(`/groups/${groupId}/members`, { email });
    return response.data.data;
  },

  removeMember: async (groupId: string, userId: string): Promise<void> => {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  },

  promoteMember: async (groupId: string, userId: string): Promise<void> => {
    await api.patch(`/groups/${groupId}/members/${userId}/promote`);
  },

  createInvitation: async (groupId: string, email: string): Promise<Invitation> => {
    const response = await api.post<ApiResponse<Invitation>>(`/groups/${groupId}/invite`, { email });
    return response.data.data;
  },

  acceptInvitation: async (token: string): Promise<Invitation> => {
    const response = await api.post<ApiResponse<Invitation>>(`/groups/invite/${token}/accept`);
    return response.data.data;
  },

  getGroupCategories: async (groupId: string): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>(`/groups/${groupId}/categories`);
    return response.data.data;
  },
};
