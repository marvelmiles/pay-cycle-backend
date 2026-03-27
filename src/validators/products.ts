import { body } from "express-validator";

export const createProductValidator = [
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("price").isNumeric().withMessage("Price must be a number"),
  body("currency").trim().notEmpty().withMessage("Currency is required"),
  body("type")
    .isIn(["one_time", "recurring"])
    .withMessage("Invalid product type"),
  body("interval")
    .optional()
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage("Invalid billing interval"),
];

export const updateProductValidator = [
  body("name").optional().trim().notEmpty().withMessage("Product name cannot be empty"),
  body("price").optional().isNumeric().withMessage("Price must be a number"),
  body("currency").optional().trim().notEmpty().withMessage("Currency cannot be empty"),
  body("type")
    .optional()
    .isIn(["one_time", "recurring"])
    .withMessage("Invalid product type"),
  body("interval")
    .optional()
    .isIn(["daily", "weekly", "monthly", "yearly"])
    .withMessage("Invalid billing interval"),
];
