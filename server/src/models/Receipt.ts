import mongoose, { Document, Schema } from 'mongoose';

export interface IReceipt extends Document {
  _id: mongoose.Types.ObjectId;
  expenseId: mongoose.Types.ObjectId;
  url: string;
  publicId: string;
  fileType: string;
  originalName: string;
  size: number;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const receiptSchema = new Schema<IReceipt>(
  {
    expenseId: {
      type: Schema.Types.ObjectId,
      ref: 'Expense',
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png', 'application/pdf'],
    },
    originalName: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

receiptSchema.index({ expenseId: 1 });

const Receipt = mongoose.model<IReceipt>('Receipt', receiptSchema);

export default Receipt;
