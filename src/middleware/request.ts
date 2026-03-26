import { Request, Response } from "express";
import { NextFunction } from "express";
import logger from "../utils/logger";
import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  logger.debug(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
};

export const globalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many auth attempts, try again in 15 minutes.",
  },
});
