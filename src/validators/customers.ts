import { body } from "express-validator";

export const createCustomerValidator = [
  body("email").isEmail().withMessage("Provide a valid email").normalizeEmail(),
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("phone").optional().trim().notEmpty().withMessage("Phone cannot be empty"),
];

export const updateCustomerValidator = [
  body("email").optional().isEmail().withMessage("Provide a valid email").normalizeEmail(),
  body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty"),
  body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty"),
  body("phone").optional().trim().notEmpty().withMessage("Phone cannot be empty"),
];
