import "dotenv/config";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger";
import { generateSlug } from "../utils/helpers";
import User from "../models/profiles/user";
import Customer from "../models/profiles/customer";
import Business, { IBusinessDoc } from "../models/business";
import Product from "../models/product";
import PaymentLink from "../models/billing/payment-link";
import Transaction from "../models/billing/transaction";
import Withdraw, { WithdrawStatus } from "../models/withdrawal";
import {
  TEST_ACCOUNTS,
  TEST_ACCOUNT_PASSWORD,
  TestAccount,
} from "../constants/test-accounts";

interface ProductBlueprint {
  name: string;
  description: string;
  type: "one_time" | "recurring";
  price: number;
  interval?: "daily" | "weekly" | "monthly" | "yearly";
  trialDays?: number;
  features: string[];
}

interface CustomerBlueprint {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

interface PaymentLinkBlueprint {
  title: string;
  productIndex: number;
  maxUses?: number;
}

interface WithdrawalBlueprint {
  amount: number;
  status: WithdrawStatus;
  note: string;
  daysAgo: number;
}

interface BankBlueprint {
  name: string;
  accountNumber: string;
  accountName: string;
}

interface AccountBlueprint {
  key: TestAccount["key"];
  randomSeed: number;
  bank?: BankBlueprint;
  products: ProductBlueprint[];
  customers: CustomerBlueprint[];
  paymentLinks: PaymentLinkBlueprint[];
  transactionCount: number;
  monthsOfHistory: number;
  withdrawals: WithdrawalBlueprint[];
}

interface CustomerActivity {
  totalSpent: number;
  firstSeenAt: Date;
}

interface SeedSummary {
  account: TestAccount;
  businessId: string;
  products: number;
  customers: number;
  paymentLinks: number;
  transactions: number;
  withdrawals: number;
  availableBalance: number;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const SUCCESSFUL_TRANSACTION_RATE = 0.88;
const FAILED_TRANSACTION_RATE = 0.08;

const MONTHLY_GROWTH_STEP = 0.25;
const CURRENT_MONTH_WEIGHT_BOOST = 1.6;
const CUSTOMER_SIGNUP_LEAD_HOURS = 6;

const createSeededRandom = (seed: number): (() => number) => {
  let state = seed;

  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;

    let drawn = Math.imul(state ^ (state >>> 15), 1 | state);
    drawn = (drawn + Math.imul(drawn ^ (drawn >>> 7), 61 | drawn)) ^ drawn;

    return ((drawn ^ (drawn >>> 14)) >>> 0) / 4294967296;
  };
};

const pickFrom = <T>(random: () => number, items: T[]): T =>
  items[Math.floor(random() * items.length)];

const pickFromCohort = <T>(
  random: () => number,
  items: T[],
  monthsAgo: number,
  monthsOfHistory: number,
): T => {
  const elapsedShare = (monthsOfHistory - monthsAgo) / monthsOfHistory;
  const cohortSize = Math.max(1, Math.round(items.length * elapsedShare));

  return items[Math.floor(random() * cohortSize)];
};

const subtractDays = (days: number): Date =>
  new Date(Date.now() - days * MILLISECONDS_PER_DAY);

const subtractHoursFrom = (date: Date, hours: number): Date =>
  new Date(date.getTime() - (hours * MILLISECONDS_PER_DAY) / 24);

const buildMonthlyTransactionCounts = (
  total: number,
  monthsOfHistory: number,
): number[] => {
  if (total < 1 || monthsOfHistory < 1) return [];

  const weights = Array.from(
    { length: monthsOfHistory },
    (unused, index) => 1 + index * MONTHLY_GROWTH_STEP,
  );

  weights[weights.length - 1] *= CURRENT_MONTH_WEIGHT_BOOST;

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const counts = weights.map((weight) =>
    Math.floor((weight / totalWeight) * total),
  );

  let remainder = total - counts.reduce((sum, count) => sum + count, 0);
  let cursor = counts.length - 1;

  while (remainder > 0) {
    counts[cursor] += 1;
    remainder -= 1;
    cursor = cursor === 0 ? counts.length - 1 : cursor - 1;
  }

  return counts;
};

const buildMonthOffsets = (monthlyCounts: number[]): number[] =>
  monthlyCounts.flatMap((count, index) =>
    Array.from({ length: count }, () => monthlyCounts.length - 1 - index),
  );

const pickDateWithinMonth = (random: () => number, monthsAgo: number): Date => {
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() - monthsAgo,
    1,
  );
  const endOfMonth =
    monthsAgo === 0
      ? now
      : new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

  const span = endOfMonth.getTime() - startOfMonth.getTime();

  return new Date(startOfMonth.getTime() + random() * span);
};

const pickTransactionStatus = (
  random: () => number,
): "successful" | "failed" | "pending" => {
  const draw = random();

  if (draw < SUCCESSFUL_TRANSACTION_RATE) return "successful";
  if (draw < SUCCESSFUL_TRANSACTION_RATE + FAILED_TRANSACTION_RATE) {
    return "failed";
  }

  return "pending";
};

const buildTransactionReference = (
  accountKey: string,
  index: number,
): string =>
  `TRX-${accountKey.toUpperCase()}-${String(index).padStart(4, "0")}`;

const accountBlueprints: AccountBlueprint[] = [
  {
    key: "demo",
    randomSeed: 20250901,
    bank: {
      name: "Guaranty Trust Bank",
      accountNumber: "0123456789",
      accountName: "Lagos Coffee Roasters",
    },
    monthsOfHistory: 6,
    transactionCount: 46,
    products: [
      {
        name: "250g Ethiopian Yirgacheffe",
        description: "Single origin beans roasted to order.",
        type: "one_time",
        price: 25000,
        features: ["250g roasted beans", "Free Lagos delivery"],
      },
      {
        name: "1kg House Blend",
        description: "Our everyday espresso blend in a resealable bag.",
        type: "one_time",
        price: 68000,
        features: ["1kg roasted beans", "Ground to order"],
      },
      {
        name: "Monthly Coffee Club",
        description: "A fresh bag delivered on the first of every month.",
        type: "recurring",
        price: 22000,
        interval: "monthly",
        trialDays: 7,
        features: [
          "Priority roasting",
          "Members only releases",
          "Cancel anytime",
        ],
      },
      {
        name: "Barista Masterclass",
        description: "A four hour hands on espresso workshop in Yaba.",
        type: "one_time",
        price: 45000,
        features: ["Four hours of tuition", "Take home tasting kit"],
      },
    ],
    customers: [
      {
        firstName: "Ada",
        lastName: "Eze",
        email: "ada.eze@example.com",
        phone: "08031234567",
        address: "14 Adeola Odeku Street, Victoria Island, Lagos",
      },
      {
        firstName: "Chuka",
        lastName: "Obi",
        email: "chuka.obi@example.com",
        phone: "08064738291",
        address: "7 Bode Thomas Street, Surulere, Lagos",
      },
      {
        firstName: "Fatima",
        lastName: "Yusuf",
        email: "fatima.yusuf@example.com",
        phone: "07098765432",
        address: "22 Awolowo Road, Ikoyi, Lagos",
      },
      {
        firstName: "Emeka",
        lastName: "Nwosu",
        email: "emeka.nwosu@example.com",
        phone: "08127364519",
        address: "5 Opebi Road, Ikeja, Lagos",
      },
      {
        firstName: "Simi",
        lastName: "Adeyemi",
        email: "simi.adeyemi@example.com",
        phone: "09033445566",
        address: "31 Herbert Macaulay Way, Yaba, Lagos",
      },
      {
        firstName: "Bilal",
        lastName: "Sanni",
        email: "bilal.sanni@example.com",
        phone: "08155667788",
        address: "9 Ligali Ayorinde Street, Victoria Island, Lagos",
      },
      {
        firstName: "Ngozi",
        lastName: "Okafor",
        email: "ngozi.okafor@example.com",
        phone: "08099887766",
        address: "18 Allen Avenue, Ikeja, Lagos",
      },
      {
        firstName: "Damilola",
        lastName: "Ojo",
        email: "damilola.ojo@example.com",
        phone: "07011223344",
        address: "3 Admiralty Way, Lekki Phase 1, Lagos",
      },
    ],
    paymentLinks: [
      { title: "Buy 250g Ethiopian Yirgacheffe", productIndex: 0 },
      { title: "Buy 1kg House Blend", productIndex: 1, maxUses: 200 },
      { title: "Join the Monthly Coffee Club", productIndex: 2 },
    ],
    withdrawals: [
      {
        amount: 250000,
        status: "successful",
        note: "June payout",
        daysAgo: 74,
      },
      {
        amount: 180000,
        status: "successful",
        note: "July payout",
        daysAgo: 41,
      },
      {
        amount: 120000,
        status: "pending",
        note: "August payout",
        daysAgo: 4,
      },
    ],
  },
  {
    key: "starter",
    randomSeed: 20250902,
    monthsOfHistory: 0,
    transactionCount: 0,
    products: [],
    customers: [],
    paymentLinks: [],
    withdrawals: [],
  },
  {
    key: "payouts",
    randomSeed: 20250903,
    bank: {
      name: "Zenith Bank",
      accountNumber: "2233445566",
      accountName: "Kano Textiles",
    },
    monthsOfHistory: 3,
    transactionCount: 32,
    products: [
      {
        name: "Adire Fabric Bundle",
        description: "Six yards of hand dyed adire in indigo.",
        type: "one_time",
        price: 42000,
        features: ["Six yards", "Hand dyed", "Nationwide delivery"],
      },
      {
        name: "Aso Oke Wholesale Pack",
        description: "Ten pieces of woven aso oke for resellers.",
        type: "one_time",
        price: 185000,
        features: ["Ten pieces", "Reseller pricing", "Bulk shipping"],
      },
    ],
    customers: [
      {
        firstName: "Halima",
        lastName: "Bello",
        email: "halima.bello@example.com",
        phone: "08034556677",
        address: "12 Murtala Mohammed Way, Kano",
      },
      {
        firstName: "Yusuf",
        lastName: "Danjuma",
        email: "yusuf.danjuma@example.com",
        phone: "08145566778",
        address: "48 Zoo Road, Kano",
      },
      {
        firstName: "Aisha",
        lastName: "Garba",
        email: "aisha.garba@example.com",
        phone: "07066778899",
        address: "6 Bompai Road, Kano",
      },
      {
        firstName: "Ibrahim",
        lastName: "Lawal",
        email: "ibrahim.lawal@example.com",
        phone: "09055443322",
        address: "25 Ahmadu Bello Way, Kaduna",
      },
      {
        firstName: "Maryam",
        lastName: "Sule",
        email: "maryam.sule@example.com",
        phone: "08122334455",
        address: "17 Isa Kaita Road, Katsina",
      },
    ],
    paymentLinks: [{ title: "Order the Adire Fabric Bundle", productIndex: 0 }],
    withdrawals: [
      {
        amount: 400000,
        status: "successful",
        note: "Settled payout",
        daysAgo: 52,
      },
      {
        amount: 300000,
        status: "pending",
        note: "Awaiting settlement",
        daysAgo: 2,
      },
      {
        amount: 90000,
        status: "rejected",
        note: "Payout account mismatch",
        daysAgo: 19,
      },
      {
        amount: 60000,
        status: "cancelled",
        note: "Cancelled by the merchant",
        daysAgo: 11,
      },
    ],
  },
];

const findBlueprint = (key: TestAccount["key"]): AccountBlueprint => {
  const blueprint = accountBlueprints.find(
    (candidate) => candidate.key === key,
  );

  if (!blueprint) throw new Error(`Missing blueprint for account: ${key}`);

  return blueprint;
};

const removeExistingTestData = async (): Promise<void> => {
  const emails = TEST_ACCOUNTS.map((account) => account.email);
  const users = await User.find({ email: { $in: emails } }).select("_id");
  const userIds = users.map((user) => user._id);

  const businesses = await Business.find({
    $or: [
      { owner: { $in: userIds } },
      { slug: { $in: TEST_ACCOUNTS.map((account) => account.businessSlug) } },
    ],
  }).select("_id");

  const businessIds = businesses.map((business) => business._id);

  await Promise.all([
    Transaction.deleteMany({ business: { $in: businessIds } }),
    PaymentLink.deleteMany({ business: { $in: businessIds } }),
    Product.deleteMany({ business: { $in: businessIds } }),
    Customer.deleteMany({ business: { $in: businessIds } }),
    Withdraw.deleteMany({ business: { $in: businessIds } }),
  ]);

  await Business.deleteMany({ _id: { $in: businessIds } });
  await User.deleteMany({ _id: { $in: userIds } });

  logger.info(
    `Cleared ${userIds.length} existing test account(s) and their data`,
  );
};

const seedAccount = async (account: TestAccount): Promise<SeedSummary> => {
  const blueprint = findBlueprint(account.key);
  const random = createSeededRandom(blueprint.randomSeed);

  const user = await User.create({
    email: account.email,
    password: TEST_ACCOUNT_PASSWORD,
    firstName: account.firstName,
    lastName: account.lastName,
    isVerified: true,
    isActive: true,
  });

  const business: IBusinessDoc = await Business.create({
    owner: user._id,
    name: account.businessName,
    slug: account.businessSlug,
    email: account.email,
    description: account.description,
    settings: { currency: "NGN", timezone: "Africa/Lagos" },
    bank: blueprint.bank,
  });

  const products = blueprint.products.length
    ? await Product.insertMany(
        blueprint.products.map((product) => ({
          ...product,
          business: business._id,
          currency: "NGN",
          isActive: true,
        })),
      )
    : [];

  const customers = blueprint.customers.map((customer) => ({
    ...customer,
    _id: new mongoose.Types.ObjectId(),
    business: business._id,
    isActive: true,
  }));

  const paymentLinks = blueprint.paymentLinks.length
    ? await PaymentLink.insertMany(
        blueprint.paymentLinks.map((link) => {
          const product = products[link.productIndex];

          return {
            business: business._id,
            product: product._id,
            title: link.title,
            description: product.description,
            amount: product.price,
            currency: product.currency,
            isFixedAmount: true,
            slug: `${generateSlug(link.title)}-${uuidv4().substring(0, 6)}`,
            isActive: true,
            maxUses: link.maxUses,
          };
        }),
      )
    : [];

  const activityByCustomer = new Map<string, CustomerActivity>();

  const monthOffsets = buildMonthOffsets(
    buildMonthlyTransactionCounts(
      blueprint.transactionCount,
      blueprint.monthsOfHistory,
    ),
  );

  const transactions = monthOffsets
    .map((monthsAgo, index) => {
      const product = pickFrom(random, products);
      const customer = pickFromCohort(
        random,
        customers,
        monthsAgo,
        blueprint.monthsOfHistory,
      );
      const status = pickTransactionStatus(random);
      const createdAt = pickDateWithinMonth(random, monthsAgo);
      const customerId = customer._id.toString();

      const activity = activityByCustomer.get(customerId);

      activityByCustomer.set(customerId, {
        totalSpent:
          (activity?.totalSpent || 0) +
          (status === "successful" ? product.price : 0),
        firstSeenAt:
          activity && activity.firstSeenAt < createdAt
            ? activity.firstSeenAt
            : createdAt,
      });

      return {
        business: business._id,
        customer: customer._id,
        product: product._id,
        amount: product.price,
        currency: product.currency,
        status,
        type: product.type,
        reference: buildTransactionReference(account.key, index + 1),
        paymentMethod: "card",
        failureReason:
          status === "failed" ? "Insufficient funds" : undefined,
        createdAt,
        updatedAt: createdAt,
      };
    });

  const customerDocuments = customers.map((customer) => {
    const activity = activityByCustomer.get(customer._id.toString());
    const joinedAt = activity
      ? subtractHoursFrom(activity.firstSeenAt, CUSTOMER_SIGNUP_LEAD_HOURS)
      : pickDateWithinMonth(
          random,
          Math.max(blueprint.monthsOfHistory - 1, 0),
        );

    return {
      ...customer,
      totalSpent: activity?.totalSpent || 0,
      createdAt: joinedAt,
      updatedAt: joinedAt,
    };
  });

  if (customerDocuments.length) {
    await Customer.insertMany(customerDocuments);
  }

  if (transactions.length) {
    await Transaction.insertMany(transactions);
  }

  const withdrawals = blueprint.withdrawals.map((withdrawal) => {
    const createdAt = subtractDays(withdrawal.daysAgo);

    return {
      business: business._id,
      amount: withdrawal.amount,
      currency: "NGN",
      status: withdrawal.status,
      note: withdrawal.note,
      failureReason:
        withdrawal.status === "rejected" ? withdrawal.note : undefined,
      createdAt,
      updatedAt: createdAt,
    };
  });

  if (withdrawals.length) {
    await Withdraw.insertMany(withdrawals);
  }

  const totalEarned = transactions
    .filter((transaction) => transaction.status === "successful")
    .reduce((total, transaction) => total + transaction.amount, 0);

  const totalCommitted = withdrawals
    .filter((withdrawal) =>
      ["successful", "pending"].includes(withdrawal.status),
    )
    .reduce((total, withdrawal) => total + withdrawal.amount, 0);

  const availableBalance = Math.max(totalEarned - totalCommitted, 0);

  await Business.updateOne(
    { _id: business._id },
    { availableBalance, withdrawableAmount: availableBalance },
  );

  return {
    account,
    businessId: business._id.toString(),
    products: products.length,
    customers: customers.length,
    paymentLinks: paymentLinks.length,
    transactions: transactions.length,
    withdrawals: withdrawals.length,
    availableBalance,
  };
};

const formatAmount = (amount: number): string =>
  `NGN ${amount.toLocaleString("en-NG")}`;

const buildReport = (summaries: SeedSummary[]): string => {
  const lines = summaries.map((summary) =>
    [
      `  ${summary.account.businessName} (${summary.account.label})`,
      `    email            ${summary.account.email}`,
      `    password         ${TEST_ACCOUNT_PASSWORD}`,
      `    businessId       ${summary.businessId}`,
      `    products         ${summary.products}`,
      `    customers        ${summary.customers}`,
      `    payment links    ${summary.paymentLinks}`,
      `    transactions     ${summary.transactions}`,
      `    withdrawals      ${summary.withdrawals}`,
      `    balance          ${formatAmount(summary.availableBalance)}`,
    ].join("\n"),
  );

  return ["Seeded test accounts", ...lines].join("\n\n");
};

const runSeed = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    logger.error("MONGODB_URI is not set. Copy .env.example to .env first.");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  logger.info(`Connected to ${mongoose.connection.host}`);

  await removeExistingTestData();

  const summaries: SeedSummary[] = [];

  for (const account of TEST_ACCOUNTS) {
    summaries.push(await seedAccount(account));
    logger.info(`Seeded ${account.email}`);
  }

  logger.info(buildReport(summaries));

  await mongoose.disconnect();
};

runSeed().catch(async (error) => {
  logger.error(`Seed failed: ${error}`);
  await mongoose.disconnect();
  process.exit(1);
});
