import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  currency: string;
  createdBy: mongoose.Types.ObjectId;
  settings: {
    defaultSplitType: 'equal' | 'percentage' | 'quantity' | 'exact';
    allowMembersToAddExpenses: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: [2, 'Group name must be at least 2 characters'],
      maxlength: [50, 'Group name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    currency: {
      type: String,
      default: 'INR',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    settings: {
      defaultSplitType: {
        type: String,
        enum: ['equal', 'percentage', 'quantity', 'exact'],
        default: 'equal',
      },
      allowMembersToAddExpenses: {
        type: Boolean,
        default: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

groupSchema.index({ createdBy: 1 });
groupSchema.index({ isActive: 1 });

const Group = mongoose.model<IGroup>('Group', groupSchema);

export default Group;
