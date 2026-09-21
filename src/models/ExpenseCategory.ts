import mongoose, { Schema, Model } from 'mongoose';

export interface IExpenseCategory {
  name: string;
  active: boolean;
  clientRequestId?: string;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseCategorySchema = new Schema<IExpenseCategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    clientRequestId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    revision: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

const ExpenseCategory: Model<IExpenseCategory> =
  mongoose.models.ExpenseCategory ||
  mongoose.model<IExpenseCategory>('ExpenseCategory', ExpenseCategorySchema);

export default ExpenseCategory;
