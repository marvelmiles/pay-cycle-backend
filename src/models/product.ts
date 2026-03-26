import mongoose, { Document, Schema } from "mongoose";

export interface IProductDoc extends Document {
  business: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  type: "one_time" | "recurring";
  price: number;
  currency: string;
  interval?: "daily" | "weekly" | "monthly" | "yearly";
  intervalCount?: number;
  trialDays?: number;
  features: string[];
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

const ProductSchema = new Schema<IProductDoc>(
  {
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    type: { type: String, enum: ["one_time", "recurring"], required: true },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "NGN" },
    interval: { type: String, enum: ["daily", "weekly", "monthly", "yearly"] },
    intervalCount: { type: Number, default: 1 },
    trialDays: { type: Number, default: 0 },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

const Product = mongoose.model<IProductDoc>("Product", ProductSchema);

export default Product;
