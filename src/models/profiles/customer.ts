import mongoose, { Document, Schema } from "mongoose";

export interface ICustomerDoc extends Document {
  business?: mongoose.Types.ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  metadata?: Record<string, unknown>;
  interswitchCustomerCode?: string;
  totalSpent: number;
  isActive: boolean;
  access_token?: string;
}

const CustomerSchema = new Schema<ICustomerDoc>(
  {
    business: { type: Schema.Types.ObjectId, ref: "Business" },
    email: { type: String, required: true, lowercase: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String },
    address: { type: String },
    metadata: { type: Schema.Types.Mixed },
    interswitchCustomerCode: { type: String },
    totalSpent: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    access_token: String,
  },
  { timestamps: true },
);

CustomerSchema.index({ business: 1, email: 1 }, { unique: true });

const Customer = mongoose.model<ICustomerDoc>("Customer", CustomerSchema);

export default Customer;
