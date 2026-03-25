import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";

// Payment Links - import controller
import {
  getPaymentLinks,
  getPaymentLink,
  createPaymentLink,
  updatePaymentLink,
  deletePaymentLink,
  getPublicPaymentLink,
  initiatePublicPayment,
  verifyPublicPayment,
  handleCardPayment,
  verifyPaymentOtp,
  confirmPayment,
} from "../controllers/paymentlinks.controller";

// import iswApi from '@api/isw-api';

// API Tokens - import controller
import {
  getApiTokens,
  createApiToken,
  revokeApiToken,
} from "../controllers/tokens.controller";

const options = {
  method: "POST",
  headers: {
    accept: "application/json",
    Authorization:
      "Bearer eyJhbGciOiJSUzI1NiJ9.eyJhdWQiOlsiaXN3LWNvbGxlY3Rpb25zIiwiaXN3LXBheW1lbnRnYXRld2F5IiwicGFzc3BvcnQiLCJwcm9qZWN0LXgtbWVyY2hhbnQiLCJ2YXVsdCJdLCJtZXJjaGFudF9jb2RlIjoiTVg2MDcyIiwicmVxdWVzdG9yX2lkIjoiMTIzODA4NTk1MDMiLCJzY29wZSI6WyJwcm9maWxlIl0sImp0aSI6IjVkOTczM2Y5LWMzNDEtNGFjZC04ZjE3LWViYzUyYWE0NjM2MiIsInBheWFibGVfaWQiOiIzMzU5NyIsImNsaWVudF9pZCI6IklLSUFCMjNBNEUyNzU2NjA1QzFBQkMzM0NFM0MyODdFMjcyNjdGNjYwRDYxIn0.ElgBX2KoF9LuUUpeBGzzp8CDAllTHWfgM6pJRgTtPYGJpoZufKlJrmE4QTvZV6MIVaNtK21majTgR4qXJr7CEkPK_4zCIHyN2b8a445vqhLYcbffQvK4EeUn_RzsWTmub2bruG5s4bRS1il5itPR0QQ-trEsbELU7TAHvC4p786RiAQd-K_I0bwtLzIXQN65jlw3eJxxK-BGfca-OMTUo9HGvraebfLB-7h4-vNbPred58gfLBSwK31jaLP19cMRc5Jea28jrlmGNUhHGzjnP7ZanqgC9uuvoepQsa39_DNBonR6xirxKw4aNlNLcKOTn026wyOTHIHUGlDQ3s3AOQ",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    customerId: "customer@test.com",
    amount: "10000",
    currency: "NGN",
    transactionRef: Date.now().toString(),
    authData:
      "G3cf/VTtAHCdHZNxc5GXWRI8z5P0goL2amXWDVFgb6D3XK/QMtZW90TYdl5zffDCNpiZThJzk0+eEU/Y/aYS6fyIOpQZGFrOr8hmvx5869sl2kr5u8qjnM7q5b4ZnTqdKDLtNxr3Qr7anj6YLpox1FOsiyT26mktXL+7SFOaZ15NMtne1z4xrj4R2SndowI/Znsapo7Gfzvp+L7XJyQ8kLYYRk3INjvmRPPQoJg1R0Nnh6EQE3ldIdwylB7GKtr6a71N/yCd4ZtyIcqq1ZNzdWcZyy5eEBAlDIxuECdBqH6hRq2/RbkfARqidNN4Kq0WviSRaRYGbiNjl2W9pNcM8g==",
  }),
};

const router = Router();

// HARD CODED

router.post("/pay/card-payment", handleCardPayment);

router.post("/pay/otp/verify", verifyPaymentOtp);

router.get("/pay/confirm-payment", confirmPayment);

// AI GNERATED

// ==================== PUBLIC PAY ROUTES (no auth) ====================
router.get("/public/pay/:slug", getPublicPaymentLink);
router.post("/public/pay/:slug/initiate", initiatePublicPayment);
router.get("/public/pay/verify/:reference", verifyPublicPayment);

// ==================== PAYMENT LINKS (authenticated) ====================
router.get("/payment-links", authenticate, getPaymentLinks);
router.get("/payment-links/:id", authenticate, getPaymentLink);
router.post("/payment-links", authenticate, createPaymentLink);
router.put("/payment-links/:id", authenticate, updatePaymentLink);
router.delete("/payment-links/:id", authenticate, deletePaymentLink);

// ==================== API TOKENS ====================
router.get("/api-tokens", authenticate, getApiTokens);
router.post("/api-tokens", authenticate, createApiToken);
router.delete("/api-tokens/:id", authenticate, revokeApiToken);

export default router;
