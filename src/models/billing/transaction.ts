import mongoose, { Document, Schema } from "mongoose";

export interface ITransactionDoc extends Document {
  business: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  subscription?: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: "pending" | "successful" | "failed";
  type: "one_time" | "recurring";
  reference: string;
  interswitchRef?: string;
  paymentMethod?: string;
  metadata?: Record<string, unknown>;
  failureReason?: string;
}

const TransactionSchema = new Schema<ITransactionDoc>(
  {
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    subscription: { type: Schema.Types.ObjectId, ref: "Subscription" },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: ["pending", "successful", "failed", "refunded"],
      default: "pending",
    },
    type: { type: String, enum: ["one_time", "recurring"], required: true },
    reference: { type: String, required: true, unique: true },
    interswitchRef: { type: String },
    paymentMethod: { type: String },
    metadata: { type: Schema.Types.Mixed },
    failureReason: { type: String },
  },
  { timestamps: true },
);

TransactionSchema.index({ business: 1, createdAt: -1 });
TransactionSchema.index({ reference: 1 });

const Transaction = mongoose.model<ITransactionDoc>(
  "Transaction",
  TransactionSchema,
);

export default Transaction;
