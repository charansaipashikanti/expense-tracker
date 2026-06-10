import mongoose, { Document, Schema } from 'mongoose';

export interface IMonthlyClosing extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  monthKey: string;
  isLocked: boolean;
  closedBy: mongoose.Types.ObjectId;
  closedAt: Date;
  notes?: string;
}

const monthlyClosingSchema = new Schema<IMonthlyClosing>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    monthKey: {
      type: String,
      required: true,
    },
    isLocked: {
      type: Boolean,
      default: true,
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    closedAt: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

monthlyClosingSchema.index({ groupId: 1, monthKey: 1 }, { unique: true });

const MonthlyClosing = mongoose.model<IMonthlyClosing>('MonthlyClosing', monthlyClosingSchema);

export default MonthlyClosing;
