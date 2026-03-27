import { IRouter, Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getPaymentLinks,
  getPaymentLink,
  createPaymentLink,
  updatePaymentLink,
  deletePaymentLink,
  handleCardPayment,
  verifyPaymentOtp,
  confirmPayment,
} from "../controllers/payment-links";
import {
  cardPaymentValidator,
  createPaymentLinkValidator,
  verifyOtpValidator,
} from "../validators/payment-links";
import { validate } from "../middleware/validator";

const paymentRouter: IRouter = Router();

paymentRouter.post(
  "/pay/card-payment",
  cardPaymentValidator,
  validate,
  handleCardPayment,
);

paymentRouter.post(
  "/pay/otp/verify",
  verifyOtpValidator,
  validate,
  verifyPaymentOtp,
);

paymentRouter.get("/pay/confirm-payment", confirmPayment);

paymentRouter.get("/payment-links", authenticate, getPaymentLinks);
paymentRouter.get("/payment-links/:id", authenticate, getPaymentLink);
paymentRouter.post(
  "/payment-links",
  authenticate,
  createPaymentLinkValidator,
  validate,
  createPaymentLink,
);
paymentRouter.put("/payment-links/:id", authenticate, updatePaymentLink);
paymentRouter.delete("/payment-links/:id", authenticate, deletePaymentLink);

export default paymentRouter;
