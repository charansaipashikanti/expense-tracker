import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from './api';
import type { CreateExpenseRequest, ExpenseFilters } from './api';
import { toast } from 'sonner';

export const expenseKeys = {
  all: ['expenses'] as const,
  lists: (groupId: string, filters: ExpenseFilters) => [...expenseKeys.all, 'list', groupId, filters] as const,
  details: (id: string) => [...expenseKeys.all, 'detail', id] as const,
  balances: (groupId: string) => [...expenseKeys.all, 'balances', groupId] as const,
  suggestions: (groupId: string) => [...expenseKeys.all, 'suggestions', groupId] as const,
};

export function useGroupExpenses(groupId: string, filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: expenseKeys.lists(groupId, filters),
    queryFn: () => expensesApi.getGroupExpenses(groupId, filters),
    enabled: !!groupId,
  });
}

export function useExpenseDetails(expenseId: string) {
  return useQuery({
    queryKey: expenseKeys.details(expenseId),
    queryFn: () => expensesApi.getExpense(expenseId),
    enabled: !!expenseId,
  });
}

export function useGroupBalances(groupId: string) {
  return useQuery({
    queryKey: expenseKeys.balances(groupId),
    queryFn: () => expensesApi.getBalances(groupId),
    enabled: !!groupId,
  });
}

export function useSettlementSuggestions(groupId: string) {
  return useQuery({
    queryKey: expenseKeys.suggestions(groupId),
    queryFn: () => expensesApi.getSettlementSuggestions(groupId),
    enabled: !!groupId,
  });
}

import { groupsKeys } from '@/features/groups/hooks';

export function useCreateExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExpenseRequest) => expensesApi.createExpense(data),
    onSuccess: (newExpense) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: expenseKeys.balances(groupId) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.suggestions(groupId) });
      queryClient.invalidateQueries({ queryKey: ['analytics', groupId] });
      queryClient.invalidateQueries({ queryKey: ['activity', groupId] });
      queryClient.invalidateQueries({ queryKey: groupsKeys.categories(groupId) });
      toast.success(`Expense "${newExpense.title}" added successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    },
  });
}

export function useUpdateExpense(groupId: string, expenseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateExpenseRequest>) => expensesApi.updateExpense(expenseId, data),
    onSuccess: (updatedExpense) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: expenseKeys.details(expenseId) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.balances(groupId) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.suggestions(groupId) });
      queryClient.invalidateQueries({ queryKey: ['analytics', groupId] });
      queryClient.invalidateQueries({ queryKey: ['activity', groupId] });
      queryClient.invalidateQueries({ queryKey: groupsKeys.categories(groupId) });
      toast.success(`Expense "${updatedExpense.title}" updated successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update expense');
    },
  });
}

export function useDeleteExpense(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => expensesApi.deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: expenseKeys.balances(groupId) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.suggestions(groupId) });
      queryClient.invalidateQueries({ queryKey: ['analytics', groupId] });
      queryClient.invalidateQueries({ queryKey: ['activity', groupId] });
      queryClient.invalidateQueries({ queryKey: groupsKeys.categories(groupId) });
      toast.success('Expense deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete expense');
    },
  });
}
