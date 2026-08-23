import mongoose, { Schema, Model } from 'mongoose';

export interface ITransaction {
  sessionId: mongoose.Types.ObjectId;
  type: 'income' | 'expense';
  amount: number;
  category?: mongoose.Types.ObjectId;
  platform?: 'uber' | 'didi' | 'other';
  paymentMethod: 'cash' | 'transfer' | 'other';
  description?: string;
  /** Clave de idempotencia generada por el cliente para prevenir duplicados */
  clientRequestId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkSession',
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1, // > 0 en schema también
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'ExpenseCategory',
    },
    platform: {
      type: String,
      enum: ['uber', 'didi', 'other'],
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'transfer', 'other'],
      required: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    clientRequestId: {
      type: String,
      index: true,
      sparse: true, // solo indexa documentos que lo tengan
    },
  },
  {
    timestamps: true,
  }
);

// ── Índices ──────────────────────────────────────────────────
// Consultas frecuentes de la app
TransactionSchema.index({ sessionId: 1, createdAt: -1 });
TransactionSchema.index({ sessionId: 1, type: 1 });
TransactionSchema.index({ sessionId: 1, paymentMethod: 1 });
TransactionSchema.index({ sessionId: 1, platform: 1 });
// Idempotencia: un clientRequestId único por sesión
TransactionSchema.index(
  { sessionId: 1, clientRequestId: 1 },
  { unique: true, sparse: true, name: 'idempotency_idx' }
);

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
