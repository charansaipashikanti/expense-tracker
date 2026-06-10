import mongoose, { Document, Schema } from 'mongoose';
import { EXPENSE_CATEGORIES, SPLIT_TYPES } from '../utils/constants';

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  title: string;
  amount: number;
  category: string;
  paidBy: mongoose.Types.ObjectId;
  splitType: string;
  date: Date;
  notes?: string;
  receiptId?: mongoose.Types.ObjectId;
  isRecurring: boolean;
  recurringDay?: number;
  monthKey: string;
  isDeleted: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    splitType: {
      type: String,
      enum: SPLIT_TYPES,
      required: true,
      default: 'equal',
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    receiptId: {
      type: Schema.Types.ObjectId,
      ref: 'Receipt',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringDay: {
      type: Number,
      min: 1,
      max: 28,
    },
    monthKey: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
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

expenseSchema.index({ groupId: 1, monthKey: 1 });
expenseSchema.index({ groupId: 1, category: 1 });
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ date: -1 });

const Expense = mongoose.model<IExpense>('Expense', expenseSchema);

export default Expense;
