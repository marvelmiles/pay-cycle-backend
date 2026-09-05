import mongoose, { Document, Schema } from "mongoose";

export const WITHDRAW_STATUSES = [
  "pending",
  "successful",
  "failed",
  "refunded",
  "rejected",
  "cancelled",
] as const;

export type WithdrawStatus = (typeof WITHDRAW_STATUSES)[number];

export interface IWithdrawDoc extends Document {
  business: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: WithdrawStatus;
  failureReason?: string;
  note: string;
}

const WithdrawSchema = new Schema<IWithdrawDoc>(
  {
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    status: {
      type: String,
      enum: WITHDRAW_STATUSES,
      default: "pending",
    },
    failureReason: { type: String },
    note: String,
  },
  { timestamps: true },
);

WithdrawSchema.index({ business: 1, createdAt: -1 });

const Withdraw = mongoose.model<IWithdrawDoc>("Withdraw", WithdrawSchema);

export default Withdraw;
