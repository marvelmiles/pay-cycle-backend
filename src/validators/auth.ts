import { body } from "express-validator";

export const registerValidator = [
  body("email").isEmail().withMessage("Provide a valid email").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("businessName").optional().trim().notEmpty().withMessage("Business name cannot be empty"),
];

export const loginValidator = [
  body("email").isEmail().withMessage("Provide a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

export const refreshValidator = [
  body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];
