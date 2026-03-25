import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/core.models';
import { ApiToken } from '../models/billing.models';
import { hashToken } from '../utils/helpers';
import logger from '../utils/logger';

// ==================== JWT AUTH MIDDLEWARE ====================
export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
  businessId?: string;
  tokenType?: 'jwt' | 'api_token';
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Access token required' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Check if it's an API token (sk_ prefix)
    if (token.startsWith('sk_')) {
      const hashed = hashToken(token);
      const apiToken = await ApiToken.findOne({ hashedToken: hashed, isActive: true });
      if (!apiToken) {
        res.status(401).json({ success: false, message: 'Invalid API token' });
        return;
      }
      if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
        res.status(401).json({ success: false, message: 'API token expired' });
        return;
      }
      await ApiToken.findByIdAndUpdate(apiToken._id, { lastUsedAt: new Date() });
      req.businessId = apiToken.business.toString();
      req.tokenType = 'api_token';
      next();
      return;
    }

    // JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: string;
      email: string;
      role: string;
    };
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User not found or inactive' });
      return;
    }
    req.user = { id: user._id.toString(), email: user.email, role: user.role };
    req.tokenType = 'jwt';
    next();
  } catch (error) {
    logger.error(`Auth error: ${error}`);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }
  next();
};

// ==================== ERROR HANDLER ====================
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  logger.error(`${err.message} - ${req.method} ${req.originalUrl} - ${req.ip}`);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
};

// ==================== REQUEST LOGGER ====================
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  logger.debug(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
};
