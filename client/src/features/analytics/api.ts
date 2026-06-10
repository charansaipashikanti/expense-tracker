import api from '@/lib/api';
import type { ApiResponse, DashboardStats, MonthlyTrend, CategoryBreakdown } from '@/types';

export interface MemberContribution {
  userId: string;
  name: string;
  avatar?: string;
  amount: string | number;
}

export interface BudgetUtilization {
  category: string;
  budget: number;
  spent: number;
  percentage: number;
}

export interface Insight {
  type: 'info' | 'warning' | 'success';
  title: string;
  message: string;
}

export const analyticsApi = {
  getStats: async (groupId: string): Promise<DashboardStats> => {
    const response = await api.get<ApiResponse<DashboardStats>>(`/analytics/group/${groupId}/stats`);
    return response.data.data;
  },

  getTrend: async (groupId: string): Promise<MonthlyTrend[]> => {
    const response = await api.get<ApiResponse<MonthlyTrend[]>>(`/analytics/group/${groupId}/trend`);
    return response.data.data;
  },

  getCategories: async (groupId: string): Promise<CategoryBreakdown[]> => {
    const response = await api.get<ApiResponse<CategoryBreakdown[]>>(`/analytics/group/${groupId}/categories`);
    return response.data.data;
  },

  getContributions: async (groupId: string): Promise<MemberContribution[]> => {
    const response = await api.get<ApiResponse<MemberContribution[]>>(`/analytics/group/${groupId}/contributions`);
    return response.data.data;
  },

  getBudgetUtilization: async (groupId: string): Promise<BudgetUtilization[]> => {
    const response = await api.get<ApiResponse<BudgetUtilization[]>>(`/analytics/group/${groupId}/budget-utilization`);
    return response.data.data;
  },

  getInsights: async (groupId: string): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>(`/analytics/group/${groupId}/insights`);
    return response.data.data;
  },
};
