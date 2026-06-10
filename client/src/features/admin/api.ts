import api from '@/lib/api';
import type { ApiResponse, User, Group } from '@/types';

export interface SystemAnalytics {
  totalUsers: number;
  totalGroups: number;
  totalExpenses: number;
  activeUsersThisMonth: number;
}

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedGroups {
  items: Group[];
  total: number;
  page: number;
  limit: number;
}

export const adminApi = {
  getUsers: async (page = 1, limit = 20): Promise<PaginatedUsers> => {
    const response = await api.get<ApiResponse<PaginatedUsers>>('/admin/users', {
      params: { page, limit },
    });
    return response.data.data;
  },

  toggleUserStatus: async (userId: string): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`/admin/users/${userId}/toggle`);
    return response.data.data;
  },

  getGroups: async (page = 1, limit = 20): Promise<PaginatedGroups> => {
    const response = await api.get<ApiResponse<PaginatedGroups>>('/admin/groups', {
      params: { page, limit },
    });
    return response.data.data;
  },

  deleteGroup: async (groupId: string): Promise<void> => {
    await api.delete(`/admin/groups/${groupId}`);
  },

  getSystemAnalytics: async (): Promise<SystemAnalytics> => {
    const response = await api.get<ApiResponse<SystemAnalytics>>('/admin/analytics');
    return response.data.data;
  },
};
