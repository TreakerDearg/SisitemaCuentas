import mongoose, { Schema, Model } from 'mongoose';

export interface IWorkSession {
  vehicleId: mongoose.Types.ObjectId;
  date: Date;
  startTime: Date;
  endTime?: Date;
  status: 'open' | 'closed';
  initialCash: number;
  initialKm: number;
  finalKm?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkSessionSchema = new Schema<IWorkSession>(
  {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      required: true,
    },
    initialCash: {
      type: Number,
      required: true,
      min: 0,
    },
    initialKm: {
      type: Number,
      required: true,
      min: 0,
    },
    finalKm: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
WorkSessionSchema.index({ status: 1 });
WorkSessionSchema.index({ date: -1 });
WorkSessionSchema.index({ vehicleId: 1 });

const WorkSession: Model<IWorkSession> =
  mongoose.models.WorkSession || mongoose.model<IWorkSession>('WorkSession', WorkSessionSchema);

export default WorkSession;
