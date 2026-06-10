import api from '@/lib/api';
import type { Budget, ApiResponse } from '@/types';

export interface SetBudgetRequest {
  category: string;
  amount: number;
  month: number;
  year: number;
}

export interface BulkSetBudgetRequest {
  budgets: Array<{
    category: string;
    amount: number;
  }>;
  month: number;
  year: number;
}

export const budgetsApi = {
  getBudgets: async (groupId: string, monthKey?: string): Promise<Budget[]> => {
    const response = await api.get<ApiResponse<Budget[]>>(`/budgets/group/${groupId}`, {
      params: { monthKey },
    });
    return response.data.data;
  },

  setBudget: async (groupId: string, data: SetBudgetRequest): Promise<Budget> => {
    const response = await api.post<ApiResponse<Budget>>(`/budgets/group/${groupId}`, data);
    return response.data.data;
  },

  bulkSetBudgets: async (groupId: string, data: BulkSetBudgetRequest): Promise<Budget[]> => {
    const response = await api.post<ApiResponse<Budget[]>>(`/budgets/group/${groupId}/bulk`, data);
    return response.data.data;
  },
};
