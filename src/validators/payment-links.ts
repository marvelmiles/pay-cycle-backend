import { body } from "express-validator";

export const createPaymentLinkValidator = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("productId").isMongoId().withMessage("Invalid product ID"),
  body("description").optional().trim().notEmpty().withMessage("Description cannot be empty"),
  body("redirectUrl").optional().isURL().withMessage("Provide a valid redirect URL"),
  body("maxUses").optional().isInt({ min: 1 }).withMessage("Max uses must be at least 1"),
  body("expiresAt").optional().isISO8601().withMessage("Provide a valid expiration date"),
];

export const cardPaymentValidator = [
  body("cardDetails.pan").notEmpty().withMessage("Card PAN is required"),
  body("cardDetails.cvv").isLength({ min: 3, max: 4 }).withMessage("Invalid CVV"),
  body("cardDetails.exp_date").notEmpty().withMessage("Expiration date is required"),
  body("cardDetails.pin").notEmpty().withMessage("PIN is required"),
  body("amount").isNumeric().withMessage("Amount must be a number"),
  body("customerDetails.email").isEmail().withMessage("Valid customer email required"),
  body("businessId").isMongoId().withMessage("Invalid business ID"),
  body("productId").isMongoId().withMessage("Invalid product ID"),
];

export const verifyOtpValidator = [
  body("paymentId").notEmpty().withMessage("Payment ID is required"),
  body("otp").notEmpty().withMessage("OTP is required"),
  body("transactionId").optional().notEmpty().withMessage("Transaction ID cannot be empty"),
];
