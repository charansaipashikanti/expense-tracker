import mongoose, { Document, Schema } from 'mongoose';

export interface IExpenseSplit extends Document {
  _id: mongoose.Types.ObjectId;
  expenseId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  percentage?: number;
  quantity?: number;
  isPaid: boolean;
}

const expenseSplitSchema = new Schema<IExpenseSplit>(
  {
    expenseId: {
      type: Schema.Types.ObjectId,
      ref: 'Expense',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    quantity: {
      type: Number,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

expenseSplitSchema.index({ expenseId: 1 });
expenseSplitSchema.index({ userId: 1 });
expenseSplitSchema.index({ expenseId: 1, userId: 1 });

const ExpenseSplit = mongoose.model<IExpenseSplit>('ExpenseSplit', expenseSplitSchema);

export default ExpenseSplit;
