import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

// ==================== USER MODEL ====================
export interface IUserDoc extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "business_owner" | "admin" | "developer";
  isVerified: boolean;
  isActive: boolean;
  refreshToken?: string;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["business_owner", "admin", "developer"],
      default: "business_owner",
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    refreshToken: { type: String, select: false },
  },
  { timestamps: true },
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UserSchema.methods.comparePassword = async function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model<IUserDoc>("User", UserSchema);

// ==================== BUSINESS MODEL ====================
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
  },
  { timestamps: true },
);

export const Business = mongoose.model<IBusinessDoc>(
  "Business",
  BusinessSchema,
);

// ==================== PRODUCT MODEL ====================
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

export const Product = mongoose.model<IProductDoc>("Product", ProductSchema);

// ==================== CUSTOMER MODEL ====================
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

export const Customer = mongoose.model<ICustomerDoc>(
  "Customer",
  CustomerSchema,
);
