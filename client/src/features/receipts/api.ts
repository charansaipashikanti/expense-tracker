import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface ReceiptInfo {
  _id: string;
  expenseId: string;
  url: string;
  publicId: string;
  fileType: string;
  originalName: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export const receiptsApi = {
  uploadReceipt: async (expenseId: string, file: File): Promise<ReceiptInfo> => {
    const formData = new FormData();
    formData.append('receipt', file);
    const response = await api.post<ApiResponse<ReceiptInfo>>(`/receipt/${expenseId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  getReceipt: async (expenseId: string): Promise<ReceiptInfo> => {
    const response = await api.get<ApiResponse<ReceiptInfo>>(`/receipt/${expenseId}`);
    return response.data.data;
  },

  deleteReceipt: async (receiptId: string): Promise<void> => {
    await api.delete(`/receipt/${receiptId}`);
  },
};
