export const EXPENSE_CATEGORIES = [
  'rent',
  'groceries',
  'vegetables',
  'milk',
  'electricity',
  'internet',
  'gas',
  'water',
  'maintenance',
  'travel',
  'food',
  'snacks',
  'cleaning',
  'medical',
  'entertainment',
  'miscellaneous',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const SPLIT_TYPES = ['equal', 'percentage', 'quantity', 'exact'] as const;
export type SplitType = (typeof SPLIT_TYPES)[number];

export const USER_ROLES = ['superadmin', 'user'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const GROUP_ROLES = ['admin', 'member'] as const;
export type GroupRole = (typeof GROUP_ROLES)[number];

export const NOTIFICATION_TYPES = [
  'expense_added',
  'expense_updated',
  'expense_deleted',
  'settlement_created',
  'settlement_request',
  'budget_exceeded',
  'rent_due',
  'user_added',
  'user_removed',
  'group_created',
  'month_closed',
  'invite_received',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const INVITATION_STATUS = ['pending', 'accepted', 'expired', 'cancelled'] as const;
export type InvitationStatus = (typeof INVITATION_STATUS)[number];

export const CURRENCIES = {
  INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  USD: { symbol: '$', code: 'USD', name: 'US Dollar' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro' },
  GBP: { symbol: '£', code: 'GBP', name: 'British Pound' },
} as const;

export const DEFAULT_CURRENCY = 'INR';

export const MONTH_KEY_FORMAT = 'YYYY-MM'; // e.g., "2026-06"

export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 20,
  maxLimit: 100,
};
