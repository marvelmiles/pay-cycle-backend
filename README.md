<div align="center">

<img src="https://img.shields.io/badge/PayCycle-Payment%20Platform-2563EB?style=for-the-badge&logo=lightning&logoColor=white" alt="PayCycle" />

# PayCycle

**The fastest way for Nigerian businesses to create checkout links, collect payments, and manage billing — all in one place.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pay--cycle.netlify.app-2563EB?style=flat-square&logo=netlify)](https://pay-cycle.netlify.app/)
[![Backend API](https://img.shields.io/badge/Backend%20API-Render-00C7B7?style=flat-square&logo=render)](https://pay-cycle-backend.onrender.com)
[![Frontend Repo](https://img.shields.io/badge/Frontend-GitHub-181717?style=flat-square&logo=github)](https://github.com/marvelmiles/pay-cycle)
[![Backend Repo](https://img.shields.io/badge/Backend-GitHub-181717?style=flat-square&logo=github)](https://github.com/marvelmiles/pay-cycle-backend)
[![Built with Interswitch](https://img.shields.io/badge/Payments-Interswitch-003B71?style=flat-square)](https://developer.interswitchgroup.com)

</div>

---

## 📖 Overview

PayCycle is a business billing and payment management platform built for the Nigerian market. It allows business owners to create shareable checkout payment links for their products and collect one-time payments — without writing a single line of code. Developers can also integrate via API and SDK for full-code experiences.

Built on top of **Interswitch** as the payment gateway, PayCycle handles the full payment lifecycle: from creating a product, generating a checkout link, collecting card details with OTP verification, recording transactions, and managing payouts — all within a single, branded dashboard.

**Endpoint breakdown** is documented at the end of the file

Please read our **Limitation & Blocker** section with interswitch documentation.

---

## ✨ Features

| Feature                     | Description                                                                   |
| --------------------------- | ----------------------------------------------------------------------------- |
| 🔗 **Payment Links**        | Generate shareable checkout URLs tied to a product — no code required         |
| 💳 **Checkout Page**        | Branded 3-step payment flow: customer details → card entry → OTP verification |
| 👥 **Customer Management**  | Auto-creates customer profiles on payment; track lifetime value               |
| 📊 **Transaction Tracking** | Full transaction history with status, gateway ref, and detail view            |
| 💰 **Wallet & Payouts**     | Available balance, withdrawal requests, payout account management             |
| 📈 **Analytics Dashboard**  | Revenue charts, Montly Revenue, Transaction stats, payment success rate       |
| 🔐 **JWT Authentication**   | Secure login, registration, and refresh token support                         |

---

## ⚠️ Limitations & Blockers

**NOTE**: Issues and blocker was escalated on the slack group. The issues below are issues the support team couldn't attend to before submittion.

**Card Payment APi**

- Card api endpoint (https://qa.interswitchng.com/api/v3/purchases) isn't stable as of 3PM deadline day. The endpoint returns 500 server error which will cause the checkout payment flow to show an error message. My team can't refactor or pivot from what we have implemented and hope the support team fix this error before judges review.

**Subscription management UI was not shipped** due to the following blockers encountered during development:

- The Interswitch API did not expose endpoints for **pausing**, **resuming**, and **cancelling** subscriptions at the time of development.
- The recurring charges feature was implemented and tested on the **backend**, but could not be integrated end-to-end on the frontend without those gateway endpoints.
- endpint to charge recurring payment throws **server error** https://qa.interswitchng.com/api/v3/purchases/recurrents
- As a result, all subscription-related UI (subscription list, cancel/pause/resume actions) was removed from the shipped version to avoid presenting broken features.

**The following is fully functional:**

- One-time payment checkout via payment links ✅
- Transaction recording and tracking ✅
- Wallet and payout management ✅

---

## 🖥️ Tech Stack

### Key Backend Technology

| Technology           | Purpose                    |
| -------------------- | -------------------------- |
| Node.js + TypeScript | Runtime & type safety      |
| Express              | HTTP server & routing      |
| MongoDB + Mongoose   | Database & ODM             |
| Cloudinary           | file uploading and storage |
| JWT                  | Authentication             |

---

## 🚀 Live Links

| Resource           | URL                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------- |
| 🌐 Frontend (Live) | [https://pay-cycle.netlify.app](https://pay-cycle.netlify.app/)                              |
| ⚙️ Backend API     | [https://pay-cycle-backend.onrender.com](https://pay-cycle-backend.onrender.com)             |
| 📁 Frontend Repo   | [github.com/marvelmiles/pay-cycle](https://github.com/marvelmiles/pay-cycle)                 |
| 📁 Backend Repo    | [github.com/marvelmiles/pay-cycle-backend](https://github.com/marvelmiles/pay-cycle-backend) |

---

## ⚙️ Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8 — install globally if you haven't:

```bash
npm install -g pnpm
```

---

### 1. Clone the Repository

```bash
# Clone the backend (separate repo)
git clone https://github.com/marvelmiles/pay-cycle-backend.git
cd pay-cycle-backend

# Install

pnpm install

# Create env file in root folder with key pair values

```

Open `.env` and fill in your values:

```env
# Interswitch Payment Gateway
NODE_ENV=development
PORT=5000

MONGODB_URI=""

JWT_SECRET=""
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=""
JWT_REFRESH_EXPIRES_IN=30d

INTERSWITCH_CLIENT_ID=""
INTERSWITCH_CLIENT_SECRET=""
INTERSWITCH_BASE_URL=https://sandbox.interswitchng.com
INTERSWITCH_PASSPORT_URL=https://passport.interswitchng.com
INTERSWITCH_PAYABLE_CODE=Default_Payable_{{MERCHANT_CODE}}
INTERSWITCH_MERCHANT_CODE={{MERCHANT_CODE}}
INTERSWITCH_PROVIDER_ENCODED_VALUE=""
INTERSWITCH_MERCHANT_ENCODED_VALUE=""

APP_NAME=Paycycle
APP_URL=https://pay-cycle.netlify.app
API_URL=https://pay-cycle-backend.onrender.com/api/v1

CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

```

Start the development server:

```bash
pnpm dev
```

The app will be available at **http://localhost:5000**

Build for production:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

---

## 👥 Team

| Name                       | Role                               |
| -------------------------- | ---------------------------------- |
| **Marvellous Akinrinmola** | Fullstack Developer                |
| **Olamilekan Muhammed**    | Product Designer / Project Manager |
| **Hassan Saidu**           | Backend Developer                  |
| **Oketola Samuel**         | Frontend Developer                 |

---

## API Endpoint Breakdown

```

[Register]

endpoint: /auth/register
method: POST
payload: {
  firstName: string,
  lastName: string,
  email: string,
  password: string
  businessName: string;
}

[Login]

endpoint: /auth/login
method: POST
payload: {
  email: string,
  password: string
}

[Refresh Token]

endpoint: /auth/refresh
method: POST
payload: {}

[Logout]

endpoint: /auth/logout
method: POST
auth: required
payload: {}

[Get Transactions]

endpoint: /transactions
method: GET
auth: required

[Get Single Transaction]

endpoint: /transactions/:id
method: GET
auth: required
params: {
  id: string
}


[Dashboard Stats]

endpoint: /analytics/dashboard
method: GET
auth: required

[Revenue Chart]

endpoint: /analytics/revenue
method: GET
auth: required


[Get Wallet Details]

endpoint: /wallet/:businessId
method: GET
auth: required
params: {
  businessId: string
}


[Get Withdrawals]

endpoint: /wallet/withdrawals/:businessId
method: GET
auth: required

[Create Withdrawal Request]

endpoint: /wallet/withdraw/:businessId
method: POST
auth: required
payload: {
  amount: number,
  note?: object
}

[Cancel Withdrawal Request]

endpoint: /wallet/withdraw/:id/:businessId/cancel
method: POST
auth: required
params: {
  id: string,
  businessId: string
}

[Get Products]

endpoint: /products
method: GET
auth: required

[Get Product]

endpoint: /products/:id
method: GET
auth: required

[Create Product]

endpoint: /products
method: POST
auth: required
payload: {
  name: string,
  price: number,
  description?: string
  features: string[]
}

[Update Product]

endpoint: /products/:id
method: PUT
auth: required

[Delete Product]

endpoint: /products/:id
method: DELETE
auth: required

[Card Payment]

endpoint: /pay/card-payment
method: POST
payload:
{
      cardDetails: {
  cvv: string;
  exp_date: string;
  pan: string;
  pin: string;
},
      amount:string|number,
      customerDetails: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
      },
      paymentType: "recurring"|"one_time";
      businessId: string;
      productId: string;
    }

[Verify OTP]

endpoint: /pay/otp/verify
method: POST
payload: {
  paymentId: string;
  otp: string,
  transactionRef: string
}

[Confirm Payment]

endpoint: /pay/confirm-payment
method: GET


[Get Payment Links]

endpoint: /payment-links
method: GET
auth: required

[Get Payment Link]

endpoint: /payment-links/:id
method: GET

[Create Payment Link]

endpoint: /payment-links
method: POST
auth: required

[Update Payment Link]

endpoint: /payment-links/:id
method: PUT
auth: required

[Delete Payment Link]

endpoint: /payment-links/:id
method: DELETE
auth: required

[Get Customers]

endpoint: /customers
method: GET
auth: required

[Get Customer]

endpoint: /customers/:id
method: GET
auth: required

[Create Customer]

endpoint: /customers
method: POST
auth: required

[Update Customer]

endpoint: /customers/:id
method: PUT
auth: required

[Get Profile]

endpoint: /profile/me
method: GET
auth: required

[Update Profile]

endpoint: /profile/me
method: PUT
auth: required
content-type: multipart/form-data
payload: {
    image?:File,
    ...others
}

[Update Business Profile]

endpoint: /profile/business/:id
method: PUT
auth: required
content-type: multipart/form-data

```

---

<div align="center">
  <sub>Built with ❤️ for Nigeria · Powered by <a href="https://developer.interswitchgroup.com">Interswitch</a></sub>
</div>
