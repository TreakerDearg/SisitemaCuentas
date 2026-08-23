import mongoose, { Schema, Model } from 'mongoose';

export interface IExpenseCategory {
  name: string;
  active: boolean;
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
  },
  {
    timestamps: true,
  }
);

const ExpenseCategory: Model<IExpenseCategory> =
  mongoose.models.ExpenseCategory ||
  mongoose.model<IExpenseCategory>('ExpenseCategory', ExpenseCategorySchema);

export default ExpenseCategory;
