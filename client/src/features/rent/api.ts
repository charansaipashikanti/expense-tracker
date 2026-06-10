import api from '@/lib/api';
import type { MonthlyRent, ApiResponse } from '@/types';

export interface ConfigureRentRequest {
  amount: number;
  month: number;
  year: number;
}

export const rentApi = {
  getRentHistory: async (groupId: string): Promise<MonthlyRent[]> => {
    const response = await api.get<ApiResponse<MonthlyRent[]>>(`/rent/group/${groupId}`);
    return response.data.data;
  },

  getCurrentRent: async (groupId: string): Promise<MonthlyRent | null> => {
    const response = await api.get<ApiResponse<MonthlyRent | null>>(`/rent/group/${groupId}/current`);
    return response.data.data;
  },

  configureRent: async (groupId: string, data: ConfigureRentRequest): Promise<MonthlyRent> => {
    const response = await api.post<ApiResponse<MonthlyRent>>(`/rent/group/${groupId}`, data);
    return response.data.data;
  },
};
