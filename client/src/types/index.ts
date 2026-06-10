// ─── User ───
export interface User {
  _id: string;
  name: string;
  email?: string;
  mobileNumber?: string;
  role: 'superadmin' | 'user';
  avatar?: string;
  isActive: boolean;
  preferences: {
    currency: string;
    theme: 'light' | 'dark' | 'system';
    emailNotifications: boolean;
  };
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ───
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginRequest {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  name: string;
  email?: string;
  mobileNumber?: string;
  password: string;
}

// ─── Group ───
export interface Group {
  _id: string;
  name: string;
  description?: string;
  currency: string;
  createdBy: string;
  memberCount: number;
  settings: {
    defaultSplitType: SplitType;
    allowMembersToAddExpenses: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  _id: string;
  groupId: string;
  userId: string;
  user: User;
  role: 'admin' | 'member';
  isActive: boolean;
  joinedAt: string;
}

// ─── Expense ───
export type ExpenseCategory =
  | 'rent' | 'groceries' | 'vegetables' | 'milk' | 'electricity'
  | 'internet' | 'gas' | 'water' | 'maintenance' | 'travel'
  | 'food' | 'snacks' | 'cleaning' | 'medical' | 'entertainment'
  | 'miscellaneous';

export type SplitType = 'equal' | 'percentage' | 'quantity' | 'exact';

export interface Expense {
  _id: string;
  groupId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidBy: string;
  paidByUser: User;
  splitType: SplitType;
  date: string;
  notes?: string;
  receiptId?: {
    _id: string;
    url: string;
    publicId: string;
    fileType: string;
    originalName: string;
    size: number;
    uploadedBy: string;
  };
  isRecurring: boolean;
  monthKey: string;
  splits: ExpenseSplit[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSplit {
  _id: string;
  expenseId: string;
  userId: string;
  user: User;
  amount: number;
  percentage?: number;
  quantity?: number;
  isPaid: boolean;
}

// ─── Settlement ───
export interface Settlement {
  _id: string;
  groupId: string;
  paidBy: string;
  paidByUser: User;
  paidTo: string;
  paidToUser: User;
  amount: number;
  date: string;
  screenshotUrl?: string;
  notes?: string;
  monthKey: string;
  createdAt: string;
}

// ─── Monthly Rent ───
export interface MonthlyRent {
  _id: string;
  groupId: string;
  amount: number;
  month: number;
  year: number;
  monthKey: string;
  splitAmounts: { userId: string; amount: number }[];
  createdAt: string;
}

// ─── Budget ───
export interface Budget {
  _id: string;
  groupId: string;
  category: ExpenseCategory;
  amount: number;
  spent: number;
  month: number;
  year: number;
}

// ─── Notification ───
export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

// ─── Activity Log ───
export interface ActivityLog {
  _id: string;
  groupId: string;
  userId: string;
  user: User;
  action: string;
  details: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

// ─── Invitation ───
export interface Invitation {
  _id: string;
  groupId: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: string;
  invitedBy: string;
}

// ─── Balance ───
export interface MemberBalance {
  userId: string;
  user: User;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = owed money, negative = owes money
}

export interface SettlementSuggestion {
  from: User;
  to: User;
  amount: number;
}

// ─── Analytics ───
export interface DashboardStats {
  totalExpenses: number;
  currentMonthBudget: number;
  budgetRemaining: number;
  pendingSettlements: number;
  monthlyRent: number;
}

export interface MonthlyTrend {
  month: string;
  amount: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

// ─── API Response ───
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
