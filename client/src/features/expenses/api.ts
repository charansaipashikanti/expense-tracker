import api from '@/lib/api';
import type { Expense, ApiResponse, PaginatedResponse, MemberBalance, SettlementSuggestion, SplitType } from '@/types';

export interface CreateExpenseRequest {
  groupId: string;
  title: string;
  amount: number;
  category: string;
  paidBy: string; // User ID who paid
  splitType: SplitType;
  date: string; // YYYY-MM-DD
  notes?: string;
  splits: Array<{
    userId: string;
    amount?: number;
    percentage?: number;
    quantity?: number;
  }>;
}

export interface ExpenseFilters {
  monthKey?: string;
  category?: string;
  paidBy?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const expensesApi = {
  getGroupExpenses: async (groupId: string, filters: ExpenseFilters = {}): Promise<PaginatedResponse<Expense>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Expense>>>(
      `/expenses/group/${groupId}`,
      { params: filters }
    );
    return response.data.data;
  },

  getExpense: async (expenseId: string): Promise<Expense> => {
    const response = await api.get<ApiResponse<Expense>>(`/expenses/${expenseId}`);
    return response.data.data;
  },

  createExpense: async (data: CreateExpenseRequest): Promise<Expense> => {
    const response = await api.post<ApiResponse<Expense>>('/expenses', data);
    return response.data.data;
  },

  updateExpense: async (expenseId: string, data: Partial<CreateExpenseRequest>): Promise<Expense> => {
    const response = await api.patch<ApiResponse<Expense>>(`/expenses/${expenseId}`, data);
    return response.data.data;
  },

  deleteExpense: async (expenseId: string): Promise<void> => {
    await api.delete(`/expenses/${expenseId}`);
  },

  getBalances: async (groupId: string): Promise<MemberBalance[]> => {
    const response = await api.get<ApiResponse<MemberBalance[]>>(`/expenses/group/${groupId}/balances`);
    return response.data.data;
  },

  getSettlementSuggestions: async (groupId: string): Promise<SettlementSuggestion[]> => {
    const response = await api.get<ApiResponse<SettlementSuggestion[]>>(`/expenses/group/${groupId}/settlement-suggestions`);
    return response.data.data;
  },
};
