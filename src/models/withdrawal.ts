import mongoose, { Document, Schema } from "mongoose";

export interface IWithdrawDoc extends Document {
  business: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: "pending" | "successful" | "rejected" | "cancelled";
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
      enum: ["pending", "successful", "failed", "refunded"],
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
