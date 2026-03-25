export interface IUser {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "business_owner" | "admin" | "developer";
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBusiness {
  _id: string;
  owner: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct {
  _id: string;
  business: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscription {
  _id: string;
  business: string;
  customer: string;
  product: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomer {
  _id: string;
  business: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  metadata?: Record<string, unknown>;
  interswitchCustomerCode?: string;
  totalSpent: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  _id: string;
  business: string;
  customer: string;
  subscription?: string;
  product: string;
  amount: number;
  currency: string;
  status: "pending" | "successful" | "failed" | "refunded";
  type: "one_time" | "subscription";
  reference: string;
  interswitchRef?: string;
  paymentMethod?: string;
  metadata?: Record<string, unknown>;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentLink {
  _id: string;
  business: string;
  product?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface IApiToken {
  _id: string;
  business: string;
  name: string;
  token: string;
  hashedToken: string;
  type: "live" | "test";
  lastUsedAt?: Date;
  expiresAt?: Date;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface IWebhookLog {
  _id: string;
  business: string;
  event: string;
  payload: Record<string, unknown>;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  nextRetryAt?: Date;
  responseStatus?: number;
  responseBody?: string;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: IUser;
  business?: IBusiness;
}

export type PaginationQuery = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  errors?: string[];
}
