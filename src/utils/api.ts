import { Response } from "express";
import logger from "./logger";

export const serializeSuccessResponse = (data: any) => {
  return {
    data,
    success: true,
  };
};

// could be a regular error or axios error
export const serializeErrorResponse = (error: any) => {
  if (error.success === false && typeof error.status === "number") return error;

  const message = error.response?.data?.message || "Something went wrong.";

  const status = error.response?.status || error.status || 500;

  return {
    success: false,
    message,
    status,
    errors: error.response?.data?.errors || [],
  };
};

export const createErrorResponse = (
  res: Response,
  error: any,
  withLoger = true,
) => {
  const err = serializeErrorResponse(error);

  if (withLoger || process.env.NODE_ENV !== "production") {
    logger.error(`Error Response: ${err.message}`);
  }

  res.status(err.status).json(err);
};
