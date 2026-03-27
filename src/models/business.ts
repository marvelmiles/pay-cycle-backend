import mongoose, { Document, Schema } from "mongoose";

export interface IBusinessDoc extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  email: string;
  phone?: string;
  address?: string;
  industry?: string;
  isActive: boolean;
  settings: {
    currency: string;
    timezone: string;
    webhookUrl?: string;
    webhookSecret?: string;
  };
  image?: string;
  withdrawableAmount: number;
  availableBalance: number;
  bank?: {
    name: string;
    accountNumber: string;
    accountName: string;
  };
}

const BusinessSchema = new Schema<IBusinessDoc>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    logo: { type: String },
    website: { type: String },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String },
    address: { type: String },
    industry: { type: String },
    isActive: { type: Boolean, default: true },
    settings: {
      currency: { type: String, default: "NGN" },
      timezone: { type: String, default: "Africa/Lagos" },
      webhookUrl: { type: String },
      webhookSecret: { type: String },
    },
    image: String,
    withdrawableAmount: {
      type: Number,
      default: 0,
    },
    availableBalance: {
      type: Number,
      default: 0,
    },
    bank: {
      name: String,
      accountNumber: String,
      accountName: String,
    },
  },
  { timestamps: true },
);

const Business = mongoose.model<IBusinessDoc>("Business", BusinessSchema);

export default Business;
