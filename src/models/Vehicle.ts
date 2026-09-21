import mongoose, { Schema, Model } from 'mongoose';

export interface IVehicle {
  name: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  active: boolean;
  clientRequestId?: string;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    name: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    plate: {
      type: String,
      required: true,
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

const Vehicle: Model<IVehicle> =
  mongoose.models.Vehicle || mongoose.model<IVehicle>('Vehicle', VehicleSchema);

export default Vehicle;
