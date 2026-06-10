import api from '@/lib/api';
import type { ApiResponse, Expense, Settlement, ActivityLog } from '@/types';

export interface MonthlyReportResponse {
  monthKey: string;
  totalExpenses: number;
  totalSettlements: number;
  expenseCount: number;
  expenses: Expense[];
  settlements: Settlement[];
  activities: ActivityLog[];
}

export const reportsApi = {
  getMonthlyReport: async (groupId: string, monthKey: string): Promise<MonthlyReportResponse> => {
    const response = await api.get<ApiResponse<MonthlyReportResponse>>(
      `/reports/group/${groupId}/monthly`,
      { params: { monthKey } }
    );
    return response.data.data;
  },
};
