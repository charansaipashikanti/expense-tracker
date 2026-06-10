import Expense from '../models/Expense';
import ExpenseSplit from '../models/ExpenseSplit';
import Settlement from '../models/Settlement';
import GroupMember from '../models/GroupMember';
import User from '../models/User';

interface MemberBalance {
  userId: string;
  userName: string;
  userEmail: string;
  totalPaid: number;   // Total amount paid by this member
  totalOwed: number;   // Total amount owed by this member (splits)
  netBalance: number;  // positive = is owed money, negative = owes money
}

interface Debt {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

class BalanceService {
  /**
   * Calculate balances for a group, optionally filtered by month
   * Implements carry-forward when no monthKey filter is applied
   */
  async calculateBalances(groupId: string, monthKey?: string): Promise<MemberBalance[]> {
    // Get active members
    const members = await GroupMember.find({
      groupId,
      isActive: true,
    }).populate('userId', 'name email avatar');

    // Build expense query
    const expenseQuery: any = { groupId, isDeleted: false };
    if (monthKey) {
      expenseQuery.monthKey = monthKey;
    }

    // Get all expenses
    const expenses = await Expense.find(expenseQuery);
    const expenseIds = expenses.map((e) => e._id);

    // Get all splits for these expenses
    const splits = await ExpenseSplit.find({
      expenseId: { $in: expenseIds },
    });

    // Get settlements
    const settlementQuery: any = { groupId };
    if (monthKey) {
      settlementQuery.monthKey = monthKey;
    }
    const settlements = await Settlement.find(settlementQuery);

    // Calculate balances
    const balanceMap = new Map<string, MemberBalance>();

    // Initialize all members
    for (const member of members) {
      const user = member.userId as any;
      balanceMap.set(user._id.toString(), {
        userId: user._id.toString(),
        userName: user.name,
        userEmail: user.email,
        totalPaid: 0,
        totalOwed: 0,
        netBalance: 0,
      });
    }

    // Add expense payments (what each person paid)
    for (const expense of expenses) {
      const payerId = expense.paidBy.toString();
      const balance = balanceMap.get(payerId);
      if (balance) {
        balance.totalPaid += expense.amount;
      }
    }

    // Add splits (what each person owes)
    for (const split of splits) {
      const userId = split.userId.toString();
      const balance = balanceMap.get(userId);
      if (balance) {
        balance.totalOwed += split.amount;
      }
    }

    // Apply settlements
    for (const settlement of settlements) {
      const payerId = settlement.paidBy.toString();
      const receiverId = settlement.paidTo.toString();

      const payerBalance = balanceMap.get(payerId);
      const receiverBalance = balanceMap.get(receiverId);

      if (payerBalance) {
        payerBalance.totalPaid += settlement.amount;
      }
      if (receiverBalance) {
        receiverBalance.totalOwed += settlement.amount;
      }
    }

    // Calculate net balances
    for (const balance of balanceMap.values()) {
      balance.netBalance = Math.round((balance.totalPaid - balance.totalOwed) * 100) / 100;
    }

    return Array.from(balanceMap.values());
  }

  /**
   * Calculate carry-forward balance for a specific month
   * Formula: Previous Balance + New Expenses Owed - Payments Made - Settlements Paid + Settlements Received
   */
  async calculateCarryForwardBalance(groupId: string, monthKey: string) {
    // Get all months up to and including this month
    const [year, month] = monthKey.split('-').map(Number);

    // Calculate all-time balances up to this month
    const expenses = await Expense.find({
      groupId,
      isDeleted: false,
      monthKey: { $lte: monthKey },
    });

    const expenseIds = expenses.map((e) => e._id);
    const splits = await ExpenseSplit.find({
      expenseId: { $in: expenseIds },
    });

    const settlements = await Settlement.find({
      groupId,
      monthKey: { $lte: monthKey },
    });

    const members = await GroupMember.find({
      groupId,
      isActive: true,
    }).populate('userId', 'name email avatar');

    const balanceMap = new Map<string, any>();

    for (const member of members) {
      const user = member.userId as any;
      balanceMap.set(user._id.toString(), {
        userId: user._id.toString(),
        userName: user.name,
        cumulativeBalance: 0,
        currentMonthExpenses: 0,
        currentMonthSettled: 0,
        carryForward: 0,
      });
    }

    // Calculate cumulative
    for (const expense of expenses) {
      const payerId = expense.paidBy.toString();
      const b = balanceMap.get(payerId);
      if (b) b.cumulativeBalance += expense.amount;
    }

    for (const split of splits) {
      const userId = split.userId.toString();
      const b = balanceMap.get(userId);
      if (b) b.cumulativeBalance -= split.amount;
    }

    for (const settlement of settlements) {
      const payerId = settlement.paidBy.toString();
      const receiverId = settlement.paidTo.toString();
      const pb = balanceMap.get(payerId);
      const rb = balanceMap.get(receiverId);
      if (pb) pb.cumulativeBalance += settlement.amount;
      if (rb) rb.cumulativeBalance -= settlement.amount;
    }

    return Array.from(balanceMap.values()).map((b) => ({
      ...b,
      cumulativeBalance: Math.round(b.cumulativeBalance * 100) / 100,
    }));
  }

  /**
   * Generate smart settlement suggestions (minimize transactions)
   * Uses a greedy algorithm to match largest creditor with largest debtor
   */
  async getSettlementSuggestions(groupId: string, monthKey?: string): Promise<Debt[]> {
    const balances = await this.calculateBalances(groupId, monthKey);

    // Separate creditors (positive balance = owed money) and debtors (negative = owes money)
    const creditors: { userId: string; name: string; amount: number }[] = [];
    const debtors: { userId: string; name: string; amount: number }[] = [];

    for (const balance of balances) {
      if (balance.netBalance > 0.01) {
        creditors.push({
          userId: balance.userId,
          name: balance.userName,
          amount: balance.netBalance,
        });
      } else if (balance.netBalance < -0.01) {
        debtors.push({
          userId: balance.userId,
          name: balance.userName,
          amount: Math.abs(balance.netBalance),
        });
      }
    }

    // Sort descending by amount
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    // Greedy settlement minimization
    const settlements: Debt[] = [];
    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
      const amount = Math.min(creditors[i].amount, debtors[j].amount);

      if (amount > 0.01) {
        settlements.push({
          from: debtors[j].userId,
          fromName: debtors[j].name,
          to: creditors[i].userId,
          toName: creditors[i].name,
          amount: Math.round(amount * 100) / 100,
        });
      }

      creditors[i].amount -= amount;
      debtors[j].amount -= amount;

      if (creditors[i].amount < 0.01) i++;
      if (debtors[j].amount < 0.01) j++;
    }

    return settlements;
  }
}

export const balanceService = new BalanceService();
