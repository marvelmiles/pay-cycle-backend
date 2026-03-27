import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/profiles/user";
import { AppError } from "../utils/AppError";
import { AuthReq } from "../types/request";

export interface AuthRequest extends AuthReq {
  businessId?: string;
  tokenType?: "jwt" | "api_token";
}

export const authenticate = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthorized("Access token required");
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
      id: string;
      email: string;
      role: string;
    };

    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      throw AppError.unauthorized("User not found or inactive");
    }

    req.user = { id: user._id.toString(), email: user.email, role: user.role } as any;
    req.tokenType = "jwt";
    next();
  },
);
