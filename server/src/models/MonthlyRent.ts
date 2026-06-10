import mongoose, { Document, Schema } from 'mongoose';

export interface IMonthlyRent extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  amount: number;
  month: number;
  year: number;
  monthKey: string;
  splitAmounts: {
    userId: mongoose.Types.ObjectId;
    amount: number;
  }[];
  isPaid: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const monthlyRentSchema = new Schema<IMonthlyRent>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Rent amount is required'],
      min: [0, 'Rent amount must be positive'],
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
    splitAmounts: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true },
      },
    ],
    isPaid: {
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

monthlyRentSchema.index({ groupId: 1, monthKey: 1 }, { unique: true });

const MonthlyRent = mongoose.model<IMonthlyRent>('MonthlyRent', monthlyRentSchema);

export default MonthlyRent;
