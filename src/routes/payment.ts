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

const paymentRouter: IRouter = Router();

paymentRouter.post("/pay/card-payment", handleCardPayment);

paymentRouter.post("/pay/otp/verify", verifyPaymentOtp);

paymentRouter.get("/pay/confirm-payment", confirmPayment);

paymentRouter.get("/payment-links", authenticate, getPaymentLinks);
paymentRouter.get("/payment-links/:id", getPaymentLink);
paymentRouter.post("/payment-links", authenticate, createPaymentLink);
paymentRouter.put("/payment-links/:id", authenticate, updatePaymentLink);
paymentRouter.delete("/payment-links/:id", authenticate, deletePaymentLink);

export default paymentRouter;
