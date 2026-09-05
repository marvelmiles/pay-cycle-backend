import {
  TEST_ACCOUNTS,
  TEST_ACCOUNT_PASSWORD,
} from "../constants/test-accounts";

const buildTestAccountTable = (): string => {
  const header = [
    "| Account | Email | Password | What is seeded |",
    "| --- | --- | --- | --- |",
  ];

  const rows = TEST_ACCOUNTS.map(
    (account) =>
      `| **${account.label}** <br/> ${account.businessName} | \`${account.email}\` | \`${TEST_ACCOUNT_PASSWORD}\` | ${account.description} |`,
  );

  return [...header, ...rows].join("\n");
};

export const API_DESCRIPTION = `
PayCycle lets Nigerian businesses sell a product through a shareable checkout link and get paid by card, without writing gateway code. This reference covers every endpoint the dashboard and the hosted checkout use, so a frontend can be built against it end to end.

## Base URL

Every path below is relative to the base URL selected in the **Servers** dropdown at the top of this page. It defaults to the environment these docs are served from: localhost while you develop, the deployed API in production. The full shape of a request is \`{base URL}{path}\`, for example \`http://localhost:5000/api/v1/products\`.

## Authentication

Protected endpoints expect a JSON Web Token:

\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

Call \`POST /auth/login\` or \`POST /auth/register\` to get an \`accessToken\` (valid for 7 days) and a \`refreshToken\` (valid for 30 days). When the access token expires, \`POST /auth/refresh\` returns a new pair and invalidates the old refresh token, so always store the newest one.

**Signing in from this page authorises the whole reference automatically.** Run \`POST /auth/login\` with any test account below and the access token is captured and applied to every protected endpoint. To do it by hand, use the **Authorize** button and paste the token.

Four endpoints are public because the hosted checkout calls them before a payer has an account: \`GET /payment-links/{id}\`, \`POST /pay/card-payment\`, \`POST /pay/otp/verify\` and \`GET /pay/confirm-payment\`.

## Test accounts

Every account uses the same password: \`${TEST_ACCOUNT_PASSWORD}\`. Run \`pnpm seed\` to create them, then expand \`POST /auth/login\`, click **Try it out**, pick an account from the **Examples** dropdown and execute.

${buildTestAccountTable()}

Seeded data is disposable. \`pnpm seed\` removes and rebuilds these three businesses on every run and never touches other records, so you can reset to a known state at any time.

## Response shape

Successful responses carry a \`success\` flag and a \`data\` payload, with \`message\` on writes:

\`\`\`json
{ "success": true, "message": "Product created", "data": { "_id": "..." } }
\`\`\`

List endpoints add a \`pagination\` block next to \`data\`:

\`\`\`json
{
  "success": true,
  "data": [],
  "pagination": { "total": 48, "page": 1, "limit": 20, "pages": 3 }
}
\`\`\`

Failures keep the same envelope with the flag inverted:

\`\`\`json
{ "success": false, "message": "Payment link not found" }
\`\`\`

Read the HTTP status first and fall back to \`message\` for anything you show a user. Internal errors are deliberately opaque, so never surface a 500 message verbatim.

## Checkout flow

The hosted checkout is three calls, all public:

1. \`POST /pay/card-payment\` charges the card and creates a pending transaction. A \`responseCode\` of \`VERIFY_OTP\` means an OTP challenge is required, \`SUCCESS\` means the charge cleared.
2. \`POST /pay/otp/verify\` completes the challenge, using the \`paymentId\` and \`transactionId\` from step one.
3. \`GET /pay/confirm-payment\` settles the transaction, credits the wallet of the business and returns the receipt data.

## Money and dates

Amounts sent to and returned by PayCycle are in **naira**. The gateway confirmation in \`GET /pay/confirm-payment\` reports its \`amount\` in **kobo**, so divide by 100 before displaying it. Every timestamp is ISO 8601 in UTC.

## Rate limits

The API allows 300 requests per 15 minutes per IP, and \`POST /auth/register\` and \`POST /auth/login\` allow 10 per 15 minutes. Exceeding either returns 429. Limits are advertised through the standard \`RateLimit-*\` response headers.

## Uploads

\`PUT /profile/me\` and \`PUT /profile/business/{id}\` take \`multipart/form-data\` with an optional \`image\` file of up to 5MB. Everything else is JSON.
`;
