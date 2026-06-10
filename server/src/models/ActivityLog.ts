import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  details: string;
  entityType: string;
  entityId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'expense_created', 'expense_updated', 'expense_deleted',
        'settlement_created', 'settlement_deleted',
        'member_added', 'member_removed', 'member_promoted',
        'group_created', 'group_updated',
        'rent_configured', 'budget_configured',
        'month_closed', 'month_reopened',
      ],
    },
    details: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: ['expense', 'settlement', 'member', 'group', 'rent', 'budget', 'month'],
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ groupId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1 });

const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);

export default ActivityLog;
