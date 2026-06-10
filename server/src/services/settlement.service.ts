import Settlement from '../models/Settlement';
import ActivityLog from '../models/ActivityLog';
import MonthlyClosing from '../models/MonthlyClosing';
import { ApiError } from '../utils/ApiError';
import { getMonthKey } from '../utils/helpers';

interface CreateSettlementInput {
  groupId: string;
  paidBy: string;
  paidTo: string;
  amount: number;
  date: string;
  screenshotUrl?: string;
  screenshotPublicId?: string;
  notes?: string;
}

class SettlementService {
  /**
   * Record a settlement
   */
  async createSettlement(data: CreateSettlementInput, userId: string) {
    const settlementDate = new Date(data.date);
    const now = new Date();
    settlementDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    const monthKey = getMonthKey(settlementDate);

    // Check month lock
    const monthLock = await MonthlyClosing.findOne({
      groupId: data.groupId,
      monthKey,
      isLocked: true,
    });
    if (monthLock) {
      throw ApiError.badRequest('This month is locked. No changes allowed.');
    }

    if (data.paidBy === data.paidTo) {
      throw ApiError.badRequest('Cannot settle with yourself');
    }

    const settlement = await Settlement.create({
      ...data,
      date: settlementDate,
      monthKey,
    });

    // Activity log
    await ActivityLog.create({
      groupId: data.groupId,
      userId,
      action: 'settlement_created',
      details: `Settled ₹${data.amount}`,
      entityType: 'settlement',
      entityId: settlement._id,
      metadata: { amount: data.amount, paidBy: data.paidBy, paidTo: data.paidTo },
    });

    return Settlement.findById(settlement._id)
      .populate('paidBy', 'name email avatar')
      .populate('paidTo', 'name email avatar');
  }

  /**
   * Get settlements for a group
   */
  async getGroupSettlements(
    groupId: string,
    filters: {
      monthKey?: string;
      userId?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const query: any = { groupId };

    if (filters.monthKey) query.monthKey = filters.monthKey;
    if (filters.userId) {
      query.$or = [
        { paidBy: filters.userId },
        { paidTo: filters.userId },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [settlements, total] = await Promise.all([
      Settlement.find(query)
        .populate('paidBy', 'name email avatar')
        .populate('paidTo', 'name email avatar')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Settlement.countDocuments(query),
    ]);

    return {
      items: settlements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Delete settlement
   */
  async deleteSettlement(settlementId: string, userId: string) {
    const settlement = await Settlement.findById(settlementId);
    if (!settlement) throw ApiError.notFound('Settlement not found');

    await Settlement.deleteOne({ _id: settlementId });

    await ActivityLog.create({
      groupId: settlement.groupId,
      userId,
      action: 'settlement_deleted',
      details: `Deleted settlement of ₹${settlement.amount}`,
      entityType: 'settlement',
      entityId: settlement._id,
    });
  }
}

export const settlementService = new SettlementService();
