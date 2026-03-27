import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { AppError } from "../utils/AppError";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log all errors for debugging
  logger.error(`${err.message} - ${req.method} ${req.originalUrl} - ${req.ip}`);

  // Handle Mongoose Errors
  if (err.name === "CastError") {
    error = AppError.notFound(`Resource not found with id: ${err.value}`);
  }

  if (err.code === 11000) {
    error = AppError.conflict("Duplicate field value entered");
  }

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(", ");
    error = AppError.badRequest(message);
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    error = AppError.unauthorized("Invalid token. Please log in again.");
  }

  if (err.name === "TokenExpiredError") {
    error = AppError.unauthorized("Expired token. Please log in again.");
  }

  // Handle Axios errors (Interswitch calling failures)
  if (err.isAxiosError) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || "Service error. Try again.";
    error = new AppError(message, status);
  }

  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(error.errors && { errors: error.errors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response): void => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
};
