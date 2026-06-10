import mongoose, { Document, Schema } from 'mongoose';

export interface ISettlement extends Document {
  _id: mongoose.Types.ObjectId;
  groupId: mongoose.Types.ObjectId;
  paidBy: mongoose.Types.ObjectId;
  paidTo: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  screenshotUrl?: string;
  screenshotPublicId?: string;
  notes?: string;
  monthKey: string;
  createdAt: Date;
}

const settlementSchema = new Schema<ISettlement>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paidTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    screenshotUrl: String,
    screenshotPublicId: String,
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    monthKey: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

settlementSchema.index({ groupId: 1, monthKey: 1 });
settlementSchema.index({ paidBy: 1 });
settlementSchema.index({ paidTo: 1 });

const Settlement = mongoose.model<ISettlement>('Settlement', settlementSchema);

export default Settlement;
