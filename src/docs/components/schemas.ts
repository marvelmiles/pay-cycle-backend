import { OpenAPIV3 } from "openapi-types";

const objectId: OpenAPIV3.SchemaObject = {
  type: "string",
  pattern: "^[0-9a-fA-F]{24}$",
  example: "66f1a2b3c4d5e6f7a8b9c0d1",
};

const timestamp: OpenAPIV3.SchemaObject = {
  type: "string",
  format: "date-time",
  example: "2025-08-14T09:31:22.104Z",
};

const currency: OpenAPIV3.SchemaObject = {
  type: "string",
  default: "NGN",
  example: "NGN",
};

export const schemas: Record<string, OpenAPIV3.SchemaObject> = {
  ObjectId: objectId,

  Pagination: {
    type: "object",
    properties: {
      total: { type: "integer", example: 48 },
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 20 },
      pages: { type: "integer", example: 3 },
    },
  },

  ErrorResponse: {
    type: "object",
    required: ["success", "message"],
    properties: {
      success: { type: "boolean", example: false },
      message: { type: "string", example: "Payment link not found" },
      status: { type: "integer", example: 404 },
      errors: {
        type: "array",
        items: { type: "object", additionalProperties: true },
      },
    },
  },

  MessageResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      message: { type: "string", example: "Product deactivated" },
    },
  },

  User: {
    type: "object",
    properties: {
      id: objectId,
      email: { type: "string", format: "email", example: "demo@paycycle.test" },
      firstName: { type: "string", example: "Amara" },
      lastName: { type: "string", example: "Okonkwo" },
      role: {
        type: "string",
        enum: ["business_owner"],
        example: "business_owner",
      },
      image: {
        type: "string",
        format: "uri",
        nullable: true,
        example: "https://res.cloudinary.com/demo/image/upload/v1/avatar.png",
      },
    },
  },

  BankAccount: {
    type: "object",
    properties: {
      name: { type: "string", example: "Guaranty Trust Bank" },
      accountNumber: { type: "string", example: "0123456789" },
      accountName: { type: "string", example: "Lagos Coffee Roasters" },
    },
  },

  BusinessSummary: {
    type: "object",
    description:
      "Business payload returned alongside the authenticated user. Balance and payout account are only present on owner facing endpoints.",
    properties: {
      id: objectId,
      name: { type: "string", example: "Lagos Coffee Roasters" },
      slug: { type: "string", example: "lagos-coffee-roasters" },
      image: { type: "string", format: "uri", nullable: true },
      availableBalance: { type: "number", example: 482500 },
      bank: { $ref: "#/components/schemas/BankAccount" },
    },
  },

  Business: {
    type: "object",
    properties: {
      _id: objectId,
      owner: objectId,
      name: { type: "string", example: "Lagos Coffee Roasters" },
      slug: { type: "string", example: "lagos-coffee-roasters" },
      description: { type: "string", nullable: true },
      email: { type: "string", format: "email" },
      phone: { type: "string", nullable: true },
      address: { type: "string", nullable: true },
      industry: { type: "string", nullable: true },
      website: { type: "string", format: "uri", nullable: true },
      image: { type: "string", format: "uri", nullable: true },
      isActive: { type: "boolean", example: true },
      availableBalance: { type: "number", example: 482500 },
      withdrawableAmount: { type: "number", example: 482500 },
      bank: { $ref: "#/components/schemas/BankAccount" },
      settings: {
        type: "object",
        properties: {
          currency,
          timezone: { type: "string", example: "Africa/Lagos" },
          webhookUrl: { type: "string", format: "uri", nullable: true },
          webhookSecret: { type: "string", nullable: true },
        },
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },

  AuthSession: {
    type: "object",
    properties: {
      user: { $ref: "#/components/schemas/User" },
      business: { $ref: "#/components/schemas/BusinessSummary" },
      accessToken: {
        type: "string",
        description:
          "Send as an Authorization Bearer header on every protected endpoint.",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZjFhMmIz",
      },
      refreshToken: {
        type: "string",
        description: "Exchange for a new access token at POST /auth/refresh.",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZjFhMmIz",
      },
    },
  },

  Product: {
    type: "object",
    properties: {
      _id: objectId,
      business: objectId,
      name: { type: "string", example: "Single Origin Subscription" },
      description: { type: "string", nullable: true },
      type: {
        type: "string",
        enum: ["one_time", "recurring"],
        example: "one_time",
      },
      price: { type: "number", example: 25000 },
      currency,
      interval: {
        type: "string",
        enum: ["daily", "weekly", "monthly", "yearly"],
        nullable: true,
        description: "Only meaningful when type is recurring.",
      },
      intervalCount: { type: "integer", example: 1 },
      trialDays: { type: "integer", example: 0 },
      features: {
        type: "array",
        items: { type: "string" },
        example: ["250g roasted beans", "Free Lagos delivery"],
      },
      isActive: { type: "boolean", example: true },
      metadata: { type: "object", additionalProperties: true, nullable: true },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },

  ProductInput: {
    type: "object",
    required: ["name", "type", "price"],
    properties: {
      name: { type: "string", example: "Single Origin Subscription" },
      description: {
        type: "string",
        example: "Freshly roasted beans delivered to your door.",
      },
      type: {
        type: "string",
        enum: ["one_time", "recurring"],
        example: "one_time",
      },
      price: { type: "number", minimum: 0, example: 25000 },
      currency,
      interval: {
        type: "string",
        enum: ["daily", "weekly", "monthly", "yearly"],
      },
      intervalCount: { type: "integer", minimum: 1, example: 1 },
      trialDays: { type: "integer", minimum: 0, example: 0 },
      features: {
        type: "array",
        items: { type: "string" },
        example: ["250g roasted beans", "Free Lagos delivery"],
      },
      isActive: { type: "boolean", example: true },
      metadata: { type: "object", additionalProperties: true },
    },
  },

  Customer: {
    type: "object",
    properties: {
      _id: objectId,
      business: objectId,
      email: { type: "string", format: "email", example: "ada@example.com" },
      firstName: { type: "string", example: "Ada" },
      lastName: { type: "string", example: "Eze" },
      phone: { type: "string", nullable: true, example: "08031234567" },
      address: { type: "string", nullable: true },
      totalSpent: { type: "number", example: 125000 },
      isActive: { type: "boolean", example: true },
      metadata: { type: "object", additionalProperties: true, nullable: true },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },

  CustomerInput: {
    type: "object",
    required: ["email", "firstName", "lastName"],
    properties: {
      email: { type: "string", format: "email", example: "ada@example.com" },
      firstName: { type: "string", example: "Ada" },
      lastName: { type: "string", example: "Eze" },
      phone: { type: "string", example: "08031234567" },
      address: {
        type: "string",
        example: "14 Adeola Odeku Street, Victoria Island",
      },
      metadata: { type: "object", additionalProperties: true },
    },
  },

  PaymentLink: {
    type: "object",
    properties: {
      _id: objectId,
      business: objectId,
      product: {
        oneOf: [objectId, { $ref: "#/components/schemas/Product" }],
        description:
          "Populated with the product summary on list and detail endpoints.",
      },
      title: { type: "string", example: "Buy 250g Ethiopian Yirgacheffe" },
      description: { type: "string", nullable: true },
      amount: { type: "number", example: 25000 },
      currency,
      isFixedAmount: { type: "boolean", example: true },
      slug: {
        type: "string",
        example: "buy-250g-ethiopian-yirgacheffe-a1b2c3",
      },
      isActive: { type: "boolean", example: true },
      expiresAt: { ...timestamp, nullable: true },
      maxUses: { type: "integer", nullable: true, example: 100 },
      useCount: { type: "integer", example: 12 },
      redirectUrl: { type: "string", format: "uri", nullable: true },
      metadata: { type: "object", additionalProperties: true, nullable: true },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },

  PaymentLinkInput: {
    type: "object",
    required: ["title", "productId"],
    properties: {
      title: { type: "string", example: "Buy 250g Ethiopian Yirgacheffe" },
      productId: {
        ...objectId,
        description:
          "An active product owned by the authenticated business. Price, currency and fallback description are copied from it.",
      },
      description: {
        type: "string",
        example: "Roasted to order and shipped within 48 hours.",
      },
      redirectUrl: {
        type: "string",
        format: "uri",
        example: "https://lagoscoffee.example/thank-you",
      },
      maxUses: { type: "integer", minimum: 1, example: 100 },
      expiresAt: {
        type: "string",
        format: "date-time",
        example: "2026-01-31T23:59:59.000Z",
      },
    },
  },

  Transaction: {
    type: "object",
    properties: {
      _id: objectId,
      business: objectId,
      customer: {
        oneOf: [objectId, { $ref: "#/components/schemas/Customer" }],
        description:
          "Populated with first name, last name and email on list endpoints.",
      },
      product: {
        oneOf: [objectId, { $ref: "#/components/schemas/Product" }],
        description: "Populated with name and type on list endpoints.",
      },
      amount: { type: "number", example: 25000 },
      currency,
      status: {
        type: "string",
        enum: ["pending", "successful", "failed"],
        example: "successful",
      },
      type: {
        type: "string",
        enum: ["one_time", "recurring"],
        example: "one_time",
      },
      reference: {
        type: "string",
        description: "Merchant side reference generated by PayCycle.",
        example: "TRX-9F2C7A45B1D8",
      },
      interswitchRef: { type: "string", nullable: true },
      paymentMethod: { type: "string", nullable: true, example: "card" },
      failureReason: { type: "string", nullable: true },
      metadata: { type: "object", additionalProperties: true, nullable: true },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },

  Withdrawal: {
    type: "object",
    properties: {
      _id: objectId,
      business: {
        oneOf: [objectId, { $ref: "#/components/schemas/Business" }],
        description:
          "Populated with the full business document on the list endpoint.",
      },
      amount: { type: "number", example: 150000 },
      currency,
      status: {
        type: "string",
        enum: [
          "pending",
          "successful",
          "failed",
          "refunded",
          "rejected",
          "cancelled",
        ],
        example: "pending",
      },
      note: { type: "string", nullable: true, example: "August payout" },
      failureReason: { type: "string", nullable: true },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  },

  WalletSummary: {
    type: "object",
    properties: {
      pendingBalance: {
        type: "number",
        description:
          "Total value of withdrawal requests still awaiting settlement.",
        example: 150000,
      },
      totalWithdrawn: {
        type: "number",
        description: "Total value of settled withdrawals.",
        example: 320000,
      },
      totalEarned: {
        type: "number",
        description: "Lifetime value of successful transactions.",
        example: 952500,
      },
    },
  },

  DashboardStats: {
    type: "object",
    properties: {
      totalRevenue: { type: "number", example: 952500 },
      monthRevenue: { type: "number", example: 187500 },
      revenueGrowth: {
        type: "number",
        description: "Percentage change against the previous calendar month.",
        example: 24.83,
      },
      totalCustomers: { type: "integer", example: 34 },
      newCustomersThisMonth: { type: "integer", example: 6 },
      failedPayments: { type: "integer", example: 4 },
      failedPaymentsThisMonth: { type: "integer", example: 1 },
      paymentSuccessRate: { type: "number", example: 92.31 },
      recentTransactions: {
        type: "array",
        items: { $ref: "#/components/schemas/Transaction" },
      },
    },
  },

  RevenuePoint: {
    type: "object",
    properties: {
      _id: {
        type: "string",
        description:
          "Bucket key. YYYY-MM for the monthly period and YYYY-MM-DD for the daily period.",
        example: "2025-08",
      },
      revenue: { type: "number", example: 187500 },
      count: { type: "integer", example: 9 },
    },
  },

  CardDetails: {
    type: "object",
    required: ["pan", "exp_date", "cvv", "pin"],
    description:
      "Raw card data. It is RSA encrypted on the server before it reaches the gateway and is never persisted.",
    properties: {
      pan: { type: "string", example: "5060990580000217499" },
      exp_date: {
        type: "string",
        description: "Expiry in MM/YY format.",
        example: "03/50",
      },
      cvv: { type: "string", example: "111" },
      pin: { type: "string", example: "1111" },
    },
  },

  CardPaymentInput: {
    type: "object",
    required: [
      "cardDetails",
      "amount",
      "customerDetails",
      "paymentType",
      "businessId",
      "productId",
    ],
    properties: {
      cardDetails: { $ref: "#/components/schemas/CardDetails" },
      amount: {
        oneOf: [{ type: "number" }, { type: "string" }],
        description: "Charge amount in naira.",
        example: 25000,
      },
      customerDetails: {
        type: "object",
        required: ["email", "firstName", "lastName"],
        properties: {
          firstName: { type: "string", example: "Ada" },
          lastName: { type: "string", example: "Eze" },
          email: {
            type: "string",
            format: "email",
            example: "ada@example.com",
          },
          phone: { type: "string", example: "08031234567" },
        },
      },
      paymentType: {
        type: "string",
        enum: ["one_time", "recurring"],
        example: "one_time",
      },
      businessId: {
        ...objectId,
        description: "Business that owns the payment link being paid.",
      },
      productId: { ...objectId, description: "Product being paid for." },
    },
  },

  CardPaymentResult: {
    type: "object",
    properties: {
      transactionId: {
        ...objectId,
        description:
          "PayCycle transaction id. Pass it back when verifying the OTP.",
      },
      transactionRef: { type: "string", example: "TRX-9F2C7A45B1D8" },
      paymentId: { type: "string", example: "884421" },
      message: {
        type: "string",
        example: "Please enter the OTP sent to your phone",
      },
      amount: { type: "string", example: "2500000" },
      responseCode: {
        type: "string",
        enum: ["SUCCESS", "VERIFY_OTP", "OK"],
        description:
          "Normalised gateway code. VERIFY_OTP means an OTP challenge is required, SUCCESS means the charge went through.",
        example: "VERIFY_OTP",
      },
      supportMessage: { type: "string", nullable: true },
      withOtp: {
        type: "boolean",
        description: "Convenience flag, true when responseCode is VERIFY_OTP.",
        example: true,
      },
    },
  },

  OtpVerificationInput: {
    type: "object",
    required: ["paymentId", "otp", "transactionId"],
    properties: {
      paymentId: { type: "string", example: "884421" },
      otp: { type: "string", example: "123456" },
      transactionId: {
        ...objectId,
        description: "The transactionId returned by POST /pay/card-payment.",
      },
    },
  },

  OtpVerificationResult: {
    type: "object",
    properties: {
      transactionRef: { type: "string", example: "TRX-9F2C7A45B1D8" },
      message: {
        type: "string",
        example: "Approved by Financial Institution",
      },
      token: { type: "string", nullable: true },
      tokenExpiryDate: {
        type: "string",
        nullable: true,
        example: "2030-03-31",
      },
      panLast4Digits: { type: "string", example: "7499" },
      amount: { type: "string", example: "2500000" },
      responseCode: {
        type: "string",
        enum: ["SUCCESS", "VERIFY_OTP", "OK"],
        example: "SUCCESS",
      },
      cardType: { type: "string", example: "Verve" },
    },
  },

  PaymentConfirmation: {
    type: "object",
    properties: {
      amount: {
        type: "number",
        description: "Settled amount in kobo.",
        example: 2500000,
      },
      cardNumber: { type: "string", example: "506099******7499" },
      merchantReference: { type: "string", example: "TRX-9F2C7A45B1D8" },
      paymentReference: { type: "string", example: "FBN|WEB|MX180271|123456" },
      retrievalReferenceNumber: { type: "string", example: "203912345678" },
      transactionDate: { type: "string", example: "2025-08-14T09:31:22" },
      responseCode: {
        type: "string",
        enum: ["SUCCESS", "VERIFY_OTP", "OK"],
        example: "SUCCESS",
      },
      supportMessage: {
        type: "string",
        example: "Approved by Financial Institution",
      },
      bankCode: { type: "string", example: "011" },
      paymentId: { type: "integer", example: 884421 },
    },
  },
};
