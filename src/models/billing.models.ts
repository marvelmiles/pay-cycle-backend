import mongoose, { Schema, Document } from "mongoose";

// ==================== TRANSACTION MODEL ====================
export interface ITransactionDoc extends Document {
  business: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  subscription?: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: "pending" | "successful" | "failed" | "refunded";
  type: "one_time" | "subscription";
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

export const Transaction = mongoose.model<ITransactionDoc>(
  "Transaction",
  TransactionSchema,
);

// ==================== SUBSCRIPTION MODEL ====================
export interface ISubscriptionDoc extends Document {
  business: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  status:
    | "active"
    | "cancelled"
    | "past_due"
    | "trialing"
    | "paused"
    | "expired";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelledAt?: Date;
  cancelAtPeriodEnd: boolean;
  interswitchSubscriptionCode?: string;
  metadata?: Record<string, unknown>;
  type: "recurring" | "one_time";
}

const SubscriptionSchema = new Schema<ISubscriptionDoc>(
  {
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    status: {
      type: String,
      enum: [
        "active",
        "cancelled",
        "past_due",
        "trialing",
        "paused",
        "expired",
      ],
      default: "active",
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    trialEnd: { type: Date },
    cancelledAt: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    interswitchSubscriptionCode: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

SubscriptionSchema.index({ business: 1, status: 1 });
SubscriptionSchema.index({ customer: 1, status: 1 });

export const Subscription = mongoose.model<ISubscriptionDoc>(
  "Subscription",
  SubscriptionSchema,
);

// ==================== PAYMENT LINK MODEL ====================
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

export const PaymentLink = mongoose.model<IPaymentLinkDoc>(
  "PaymentLink",
  PaymentLinkSchema,
);

// ==================== API TOKEN MODEL ====================
export interface IApiTokenDoc extends Document {
  business: mongoose.Types.ObjectId;
  name: string;
  token: string;
  hashedToken: string;
  type: "live" | "test";
  lastUsedAt?: Date;
  expiresAt?: Date;
  permissions: string[];
  isActive: boolean;
}

const ApiTokenSchema = new Schema<IApiTokenDoc>(
  {
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true },
    token: { type: String, required: true },
    hashedToken: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ["live", "test"], default: "test" },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const ApiToken = mongoose.model<IApiTokenDoc>(
  "ApiToken",
  ApiTokenSchema,
);

// ==================== WEBHOOK LOG MODEL ====================
export interface IWebhookLogDoc extends Document {
  business: mongoose.Types.ObjectId;
  event: string;
  payload: Record<string, unknown>;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  nextRetryAt?: Date;
  responseStatus?: number;
  responseBody?: string;
}

const WebhookLogSchema = new Schema<IWebhookLogDoc>(
  {
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    event: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["pending", "delivered", "failed"],
      default: "pending",
    },
    attempts: { type: Number, default: 0 },
    nextRetryAt: { type: Date },
    responseStatus: { type: Number },
    responseBody: { type: String },
  },
  { timestamps: true },
);

export const WebhookLog = mongoose.model<IWebhookLogDoc>(
  "WebhookLog",
  WebhookLogSchema,
);

// ==================== AUDIT LOG MODEL ====================
export interface IAuditLogDoc extends Document {
  business?: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

const AuditLogSchema = new Schema<IAuditLogDoc>(
  {
    business: { type: Schema.Types.ObjectId, ref: "Business" },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

export const AuditLog = mongoose.model<IAuditLogDoc>(
  "AuditLog",
  AuditLogSchema,
);
