export interface TestAccount {
  key: "demo" | "starter" | "payouts";
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  businessSlug: string;
  label: string;
  description: string;
}

export const TEST_ACCOUNT_PASSWORD = "PayCycle@2025";

export const TEST_ACCOUNTS: readonly TestAccount[] = [
  {
    key: "demo",
    email: "demo@paycycle.test",
    firstName: "Amara",
    lastName: "Okonkwo",
    businessName: "Lagos Coffee Roasters",
    businessSlug: "lagos-coffee-roasters",
    label: "Established merchant",
    description:
      "Six months of transaction history, active products, payment links, customers and a funded wallet. Use this account for dashboards, charts, tables and detail screens.",
  },
  {
    key: "starter",
    email: "starter@paycycle.test",
    firstName: "Tunde",
    lastName: "Balogun",
    businessName: "Balogun Studio",
    businessSlug: "balogun-studio",
    label: "New merchant",
    description:
      "A freshly registered business with no products, customers or transactions. Use this account to build and verify empty states and onboarding flows.",
  },
  {
    key: "payouts",
    email: "payouts@paycycle.test",
    firstName: "Zainab",
    lastName: "Ibrahim",
    businessName: "Kano Textiles",
    businessSlug: "kano-textiles",
    label: "Payout heavy merchant",
    description:
      "High transaction volume with pending, successful, rejected and cancelled withdrawals plus a saved payout account. Use this account for wallet and payout screens.",
  },
];

export const findTestAccountByKey = (key: TestAccount["key"]): TestAccount => {
  const account = TEST_ACCOUNTS.find((candidate) => candidate.key === key);

  if (!account) throw new Error(`Unknown test account: ${key}`);

  return account;
};
