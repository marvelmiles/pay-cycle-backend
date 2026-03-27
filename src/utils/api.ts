import { Response } from "express";
import { AppError } from "./AppError";

export const sendSuccess = (
  res: Response,
  data: any,
  message: string = "Success",
  statusCode: number = 200,
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// Deprecated in favor of global error handler
export const createErrorResponse = (res: Response, error: any) => {
  const status = error.statusCode || 500;
  res.status(status).json({
    success: false,
    message: error.message || "Something went wrong.",
  });
};
