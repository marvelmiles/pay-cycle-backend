import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../utils/logger";
import User from "../models/profiles/user";

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
  businessId?: string;
  tokenType?: "jwt" | "api_token";
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ success: false, message: "Access token required" });
      return;
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
      id: string;
      email: string;
      role: string;
    };
    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      res
        .status(401)
        .json({ success: false, message: "User not found or inactive" });
      return;
    }
    req.user = { id: user._id.toString(), email: user.email, role: user.role };
    req.tokenType = "jwt";
    next();
  } catch (error) {
    logger.error(`Auth error: ${error}`);
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};
