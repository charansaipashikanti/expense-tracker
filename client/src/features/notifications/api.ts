import api from '@/lib/api';
import type { ApiResponse, Notification } from '@/types';

export interface NotificationsResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export const notificationsApi = {
  getNotifications: async (page = 1, limit = 20): Promise<NotificationsResponse> => {
    const response = await api.get<ApiResponse<NotificationsResponse>>('/notifications', {
      params: { page, limit },
    });
    return response.data.data;
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};
