import mongoose, { Document, Schema } from 'mongoose';
import { EXPENSE_CATEGORIES } from '../utils/constants';

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  category: string;
  amount: number;
  month: number;
  year: number;
  monthKey: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const budgetSchema = new Schema<IBudget>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0, 'Budget amount must be positive'],
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    monthKey: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

budgetSchema.index({ groupId: 1, monthKey: 1, category: 1 }, { unique: true });

const Budget = mongoose.model<IBudget>('Budget', budgetSchema);

export default Budget;
