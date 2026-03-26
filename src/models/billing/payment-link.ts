import mongoose, { Document, Schema } from "mongoose";

export interface IPaymentLinkDoc extends Document {
  business: mongoose.Types.ObjectId;
  product?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  amount?: number;
  currency: string;
  isFixedAmount: boolean;
  slug: string;
  isActive: boolean;
  expiresAt?: Date;
  maxUses?: number;
  useCount: number;
  redirectUrl?: string;
  metadata?: Record<string, unknown>;
}

const PaymentLinkSchema = new Schema<IPaymentLinkDoc>(
  {
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    title: { type: String, required: true },
    description: { type: String },
    amount: { type: Number },
    currency: { type: String, default: "NGN" },
    isFixedAmount: { type: Boolean, default: true },
    slug: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date },
    maxUses: { type: Number },
    useCount: { type: Number, default: 0 },
    redirectUrl: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

const PaymentLink = mongoose.model<IPaymentLinkDoc>(
  "PaymentLink",
  PaymentLinkSchema,
);

export default PaymentLink;
