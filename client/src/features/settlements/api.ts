import api from '@/lib/api';
import type { Settlement, ApiResponse } from '@/types';

export interface CreateSettlementRequest {
  groupId: string;
  paidBy: string;
  paidTo: string;
  amount: number;
  date: string;
  notes?: string;
  screenshotUrl?: string;
}

export const settlementsApi = {
  getGroupSettlements: async (groupId: string): Promise<Settlement[]> => {
    const response = await api.get<ApiResponse<Settlement[]>>(`/settlements/group/${groupId}`);
    return response.data.data;
  },

  createSettlement: async (data: CreateSettlementRequest): Promise<Settlement> => {
    const response = await api.post<ApiResponse<Settlement>>('/settlements', data);
    return response.data.data;
  },

  deleteSettlement: async (settlementId: string): Promise<void> => {
    await api.delete(`/settlements/${settlementId}`);
  },
};
