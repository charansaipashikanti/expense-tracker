import { useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptsApi } from './api';
import { toast } from 'sonner';

export function useUploadReceipt(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, file }: { expenseId: string; file: File }) =>
      receiptsApi.uploadReceipt(expenseId, file),
    onSuccess: () => {
      // Invalidate both lists of expenses and detail queries
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Receipt uploaded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload receipt');
    },
  });
}

export function useDeleteReceipt(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (receiptId: string) => receiptsApi.deleteReceipt(receiptId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Receipt deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete receipt');
    },
  });
}
