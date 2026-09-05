<div align="center">

<img src="https://img.shields.io/badge/PayCycle-Payment%20Platform-2563EB?style=for-the-badge&logo=lightning&logoColor=white" alt="PayCycle" />

# PayCycle API

**The fastest way for Nigerian businesses to create checkout links, collect payments, and manage billing, all in one place.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pay--cycle.netlify.app-2563EB?style=flat-square&logo=netlify)](https://pay-cycle.netlify.app/)
[![Backend API](https://img.shields.io/badge/Backend%20API-Render-00C7B7?style=flat-square&logo=render)](https://pay-cycle-backend.onrender.com)
[![API Docs](https://img.shields.io/badge/API%20Docs-Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black)](https://pay-cycle-backend.onrender.com/docs)
[![Frontend Repo](https://img.shields.io/badge/Frontend-GitHub-181717?style=flat-square&logo=github)](https://github.com/marvelmiles/pay-cycle)
[![Backend Repo](https://img.shields.io/badge/Backend-GitHub-181717?style=flat-square&logo=github)](https://github.com/marvelmiles/pay-cycle-backend)
[![Built with Interswitch](https://img.shields.io/badge/Payments-Interswitch-003B71?style=flat-square)](https://developer.interswitchgroup.com)

</div>

---

## Overview

PayCycle is a business billing and payment management platform built for the Nigerian market. A business owner signs up, creates a product, generates a shareable checkout link, and starts collecting card payments without writing a line of gateway code. Developers can integrate the same capabilities directly through this REST API.

The platform is built on **Interswitch** as the payment gateway and covers the full payment lifecycle: creating a product, generating a checkout link, collecting card details with OTP verification, recording transactions, tracking customers, and managing payouts, all from a single branded dashboard.

Subscription management was removed from the shipped product because of gateway blockers. Read the [Limitations and blockers](#limitations-and-blockers) section for details.

---

## Links

| Resource            | URL                                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------------ |
| Frontend (live)     | [https://pay-cycle.netlify.app](https://pay-cycle.netlify.app/)                                              |
| Backend server      | [https://pay-cycle-backend.onrender.com](https://pay-cycle-backend.onrender.com)                             |
| API documentation   | [https://pay-cycle-backend.onrender.com/docs](https://pay-cycle-backend.onrender.com/docs)                   |
| OpenAPI spec (JSON) | [https://pay-cycle-backend.onrender.com/docs.json](https://pay-cycle-backend.onrender.com/docs.json)         |
| Frontend repository | [github.com/marvelmiles/pay-cycle](https://github.com/marvelmiles/pay-cycle)                                 |
| Backend repository  | [github.com/marvelmiles/pay-cycle-backend](https://github.com/marvelmiles/pay-cycle-backend)                 |

### API base URL

| Environment | Base URL                                        |
| ----------- | ----------------------------------------------- |
| Production  | `https://pay-cycle-backend.onrender.com/api/v1` |
| Local       | `http://localhost:5000/api/v1`                  |

Every documented path is relative to the base URL, so a product listing is `GET {base URL}/products`.

---

## API documentation

Interactive Swagger UI is served by the API itself:

- Production: [https://pay-cycle-backend.onrender.com/docs](https://pay-cycle-backend.onrender.com/docs)
- Local: [http://localhost:5000/docs](http://localhost:5000/docs)

What frontend developers get there:

- Every endpoint grouped by feature, with request bodies, query parameters, response schemas and error codes.
- A **Servers** dropdown that defaults to the environment the docs are served from. Open the docs on localhost and requests go to localhost, open them on the deployed API and they go to production.
- **Try it out** on every endpoint, so a call can be run from the browser before any code is written.
- Ready made login examples for each test account. Sign in from the page and the returned access token is captured and applied to every protected endpoint automatically, no copy and paste needed.
- The raw OpenAPI 3 document at `/docs.json`, which can be fed to a client generator such as `openapi-typescript` or Orval.

---

## Test accounts

Run `pnpm seed` to create these accounts, then sign in from the docs page or from the app. Every account uses the same password.

| Account              | Business              | Email                  | Password        | What is seeded                                                                                                            |
| -------------------- | --------------------- | ---------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Established merchant | Lagos Coffee Roasters | `demo@paycycle.test`   | `PayCycle@2025` | Six months of transaction history, 4 products, 3 payment links, 8 customers, a funded wallet and settled payouts            |
| New merchant         | Balogun Studio        | `starter@paycycle.test`| `PayCycle@2025` | A freshly registered business with no products, customers or transactions, for building and checking empty states           |
| Payout heavy merchant| Kano Textiles         | `payouts@paycycle.test`| `PayCycle@2025` | High transaction volume plus pending, successful, rejected and cancelled withdrawals and a saved payout account            |

Signing in with any of them:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@paycycle.test","password":"PayCycle@2025"}'
```

The response carries `data.accessToken`. Send it on protected endpoints as `Authorization: Bearer <accessToken>`.

---

## Seeding test data

```bash
pnpm seed
```

The script connects with `MONGODB_URI`, removes the three test businesses and everything attached to them, then rebuilds users, businesses, products, payment links, customers, transactions and withdrawals, and prints a summary with each business id and balance.

It is safe to run repeatedly. It only touches the three seeded accounts and never deletes other records, so it can be used to reset to a known state at any point. Transactions are generated from a fixed random seed and backdated across calendar months, which keeps the dashboard, the revenue chart and the customer cohorts consistent from run to run.

---

## Features

| Feature              | Description                                                                       |
| -------------------- | --------------------------------------------------------------------------------- |
| Payment links        | Generate shareable checkout URLs tied to a product, no code required               |
| Checkout             | Three step payment flow: customer details, card entry, OTP verification            |
| Customer management  | Customer profiles created automatically on payment, with lifetime value tracking   |
| Transaction tracking | Full transaction history with status, gateway reference and detail view            |
| Wallet and payouts   | Available balance, withdrawal requests and payout account management               |
| Analytics            | Revenue charts, monthly revenue, transaction stats and payment success rate        |
| Authentication       | JWT access and refresh tokens with rotation on refresh                             |
| API reference        | Swagger UI and an OpenAPI 3 document served by the API                             |

---

## Tech stack

| Technology           | Purpose                     |
| -------------------- | --------------------------- |
| Node.js + TypeScript | Runtime and type safety     |
| Express              | HTTP server and routing     |
| MongoDB + Mongoose   | Database and ODM            |
| Interswitch          | Card payment gateway        |
| Cloudinary           | File upload and storage     |
| JWT                  | Authentication              |
| Swagger UI + OpenAPI | API documentation           |
| Winston              | Structured logging          |
| Helmet + rate limit  | Baseline hardening          |

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- [pnpm](https://pnpm.io/) 8 or newer
- A MongoDB database, either local or MongoDB Atlas

```bash
npm install -g pnpm
```

### 1. Clone and install

```bash
git clone https://github.com/marvelmiles/pay-cycle-backend.git
cd pay-cycle-backend
pnpm install
```

### 2. Configure the environment

```bash
cp .env.example .env
```

Fill in the values described in [Environment variables](#environment-variables). At minimum `MONGODB_URI`, `JWT_SECRET` and `JWT_REFRESH_SECRET` are needed to boot.

### 3. Seed the test data

```bash
pnpm seed
```

### 4. Run

```bash
pnpm dev
```

| Address                            | What it serves        |
| ---------------------------------- | --------------------- |
| `http://localhost:5000/api/v1`     | The API               |
| `http://localhost:5000/docs`       | Swagger UI            |
| `http://localhost:5000/docs.json`  | The OpenAPI document  |

### Build and run in production mode

```bash
pnpm build
pnpm start
```

---

## Environment variables

Copy `.env.example` to `.env` and fill it in. Never commit `.env`.

### Required

| Variable                             | Description                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                        | MongoDB connection string. The seed script uses the same value                                     |
| `JWT_SECRET`                         | Secret used to sign access tokens                                                                  |
| `JWT_REFRESH_SECRET`                 | Secret used to sign refresh tokens. Must differ from `JWT_SECRET`                                  |
| `APP_URL`                            | Public URL of the frontend. Used to build shareable payment link URLs and to allow CORS in production |

### Recommended

| Variable                             | Description                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                           | `development` or `production`. Controls log level, CORS policy and error detail                    |
| `PORT`                               | HTTP port. Defaults to `5000`                                                                      |
| `JWT_EXPIRES_IN`                     | Access token lifetime. Defaults to `7d`                                                            |
| `JWT_REFRESH_EXPIRES_IN`             | Refresh token lifetime. Defaults to `30d`                                                          |
| `API_URL`                            | Public URL of this API. Listed as the production entry in the Swagger servers dropdown             |
| `CLOUDINARY_CLOUD_NAME`              | Cloudinary account name. Required for profile and business image uploads                           |
| `CLOUDINARY_API_KEY`                 | Cloudinary API key                                                                                 |
| `CLOUDINARY_API_SECRET`              | Cloudinary API secret                                                                              |
| `INTERSWITCH_MERCHANT_ENCODED_VALUE` | Base64 merchant credentials used to obtain a gateway token. Required for card payments             |
| `INTERSWITCH_PROVIDER_ENCODED_VALUE` | Base64 provider credentials used for recurring card validation                                     |

### Reserved

Present in the environment template for completeness and for the gateway work that is still blocked. Nothing breaks if they are left blank.

| Variable                       | Description                                                        |
| ------------------------------ | ------------------------------------------------------------------ |
| `APP_NAME`                     | Display name of the platform                                       |
| `INTERSWITCH_MERCHANT_CODE`    | Merchant code. The confirmation call currently uses a sandbox code |
| `INTERSWITCH_CLIENT_ID`        | Gateway client id                                                  |
| `INTERSWITCH_CLIENT_SECRET`    | Gateway client secret                                              |
| `INTERSWITCH_BASE_URL`         | Gateway base URL                                                   |
| `INTERSWITCH_PASSPORT_URL`     | Gateway identity service URL                                       |
| `INTERSWITCH_PAYABLE_CODE`     | Payable code tied to the merchant account                          |

---

## Architecture

Layered Express application: routes declare the surface, controllers handle HTTP, services own the gateway integration, and Mongoose models own persistence. Cross cutting concerns live in middleware and utilities so nothing is duplicated between features.

```
src/
├── config/        Database and Cloudinary clients
├── constants/     Shared constants, including the test account catalogue
├── controllers/   Request handlers, one module per feature
├── docs/          OpenAPI document, reusable components and the Swagger UI router
│   ├── components/  Schemas, responses, parameters and security schemes
│   └── paths/       Endpoint definitions, one module per feature
├── middleware/    Authentication, error handling and rate limiting
├── models/        Mongoose schemas
│   ├── billing/     Payment links and transactions
│   └── profiles/    Users and customers
├── routes/        Route declarations mounted under /api/v1
├── scripts/       Operational scripts, including the seed script
├── services/      Interswitch gateway integration and the HTTP client
├── types/         Shared TypeScript types
└── utils/         Logging, encoding, card auth data, uploads and helpers
```

Request flow for a protected endpoint:

```
Request
  -> helmet, CORS, rate limiter, body parsers
  -> route
  -> authenticate middleware (verifies the JWT, loads the user)
  -> controller (resolves the business from the owner, validates input)
  -> model or service
  -> JSON response { success, data, message }
```

### Endpoint map

The full reference with schemas and examples lives at [`/docs`](https://pay-cycle-backend.onrender.com/docs). The surface at a glance:

| Group          | Endpoints                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Authentication | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`                                                       |
| Profile        | `GET /profile/me`, `PUT /profile/me`, `PUT /profile/business/:id`                                                                          |
| Products       | `GET /products`, `POST /products`, `GET /products/:id`, `PUT /products/:id`, `DELETE /products/:id`                                        |
| Payment links  | `GET /payment-links`, `POST /payment-links`, `GET /payment-links/:id`, `PUT /payment-links/:id`, `DELETE /payment-links/:id`               |
| Checkout       | `POST /pay/card-payment`, `POST /pay/otp/verify`, `GET /pay/confirm-payment`                                                                |
| Customers      | `GET /customers`, `POST /customers`, `GET /customers/:id`, `PUT /customers/:id`                                                            |
| Transactions   | `GET /transactions`, `GET /transactions/:id`                                                                                               |
| Analytics      | `GET /analytics/dashboard`, `GET /analytics/revenue`                                                                                       |
| Wallet         | `GET /wallet/:businessId`, `GET /wallet/withdrawals/:businessId`, `POST /wallet/withdraw/:businessId`, `POST /wallet/withdraw/:id/:businessId/cancel` |

`GET /payment-links/:id` and the three checkout endpoints are public. Everything else requires a bearer token.

---

## Conventions

**Responses.** Success carries `success: true` and a `data` payload, with `message` on writes. List endpoints add `pagination` next to `data`. Failures keep the envelope with `success: false` and a `message`.

**Money.** Amounts sent to and returned by PayCycle are in naira. The gateway confirmation response reports its `amount` in kobo, so divide by 100 before displaying it.

**Dates.** Every timestamp is ISO 8601 in UTC.

**Rate limits.** 300 requests per 15 minutes per IP across the API, and 10 per 15 minutes on register and login. Both return 429 with standard `RateLimit-*` headers.

**Uploads.** Profile and business updates take `multipart/form-data` with an optional `image` file up to 5MB. Everything else is JSON.

---

## Deployment

The API is deployed on [Render](https://render.com) as a Node web service.

| Setting       | Value           |
| ------------- | --------------- |
| Build command | `pnpm install && pnpm build` |
| Start command | `pnpm start`    |
| Node version  | 18 or newer     |

Checklist before a deploy:

1. Set every required environment variable in the Render dashboard.
2. Set `NODE_ENV=production` so CORS is restricted to `APP_URL` and stack traces stay out of responses.
3. Set `API_URL` to the deployed URL so the Swagger servers dropdown lists production first.
4. Set `APP_URL` to the deployed frontend so generated payment link URLs resolve.
5. Allow the Render outbound IP range in MongoDB Atlas network access.

The seed script is not run automatically. Run `pnpm seed` locally against the production `MONGODB_URI` when the test accounts are needed there.

---

## Limitations and blockers

**Note:** these issues were escalated on the Slack group. The ones below are what the support team could not resolve before submission.

**Test credentials.** The payment integration runs on test credentials. A complaint was submitted and the live credentials request form was filled, but the credentials did not arrive before submission. Approval was given by the support team to submit on test credentials.

**Card payment API.** The card endpoint `https://qa.interswitchng.com/api/v3/purchases` was unstable as of 3PM on the deadline day, returning 500 errors that surface as an error message in the checkout flow. The implementation could not be pivoted in time.

**Subscription management UI was not shipped**, because:

- The Interswitch API exposed no endpoints for pausing, resuming or cancelling subscriptions at the time of development.
- Recurring charges were implemented and tested on the backend but could not be integrated end to end without those gateway endpoints.
- The recurring charge endpoint `https://qa.interswitchng.com/api/v3/purchases/recurrents` returns a server error.

All subscription related UI was therefore removed from the shipped version rather than presenting broken features.

**Fully functional:** one time payment checkout via payment links, transaction recording and tracking, wallet and payout management.

---

## Team

| Name                       | Role                               |
| -------------------------- | ---------------------------------- |
| **Marvellous Akinrinmola** | Fullstack Developer                |
| **Olamilekan Muhammed**    | Product Designer / Project Manager |
| **Hassan Saidu**           | Backend Developer                  |
| **Oketola Samuel**         | Frontend Developer                 |

---

<div align="center">
  <sub>Built for Nigeria. Powered by <a href="https://developer.interswitchgroup.com">Interswitch</a>.</sub>
</div>
