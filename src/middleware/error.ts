import { Request, Response } from "express";
import { NextFunction } from "express";
import logger from "../utils/logger";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void => {
  logger.error(`${err.message} - ${req.method} ${req.originalUrl} - ${req.ip}`);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response): void => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
};
