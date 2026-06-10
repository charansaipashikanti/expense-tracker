import api from '@/lib/api';
import type { ApiResponse, PaginatedResponse, ActivityLog } from '@/types';

export const activityApi = {
  getGroupActivity: async (
    groupId: string,
    page = 1,
    limit = 30
  ): Promise<PaginatedResponse<ActivityLog>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<ActivityLog>>>(
      `/reports/group/${groupId}/activity`,
      { params: { page, limit } }
    );
    return response.data.data;
  },
};
