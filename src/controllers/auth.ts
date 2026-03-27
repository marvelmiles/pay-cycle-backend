import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import { generateSlug } from "../utils/helpers";
import logger from "../utils/logger";
import User from "../models/profiles/user";
import Business from "../models/business";
import { getBusinessPublicData, getUserPublicData } from "../utils/profile";

const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign(
    { id: userId, email, role },
    (process.env.JWT_SECRET as string) || "secret",
    {
      expiresIn: process.env.JWT_EXPIRES_IN! || "7d",
    } as SignOptions,
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || "refresh-secret",
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN! || "30d" } as SignOptions,
  );
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, businessName } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res
        .status(409)
        .json({ success: false, message: "Email already registered" });
      return;
    }

    const user = await User.create({ email, password, firstName, lastName });

    let slug = generateSlug(businessName || `${firstName}-${lastName}`);
    const existingBiz = await Business.findOne({ slug });
    if (existingBiz) slug = `${slug}-${Date.now()}`;

    const business = await Business.create({
      owner: user._id,
      name: businessName || `${firstName}'s Business`,
      slug,
      email: user.email,
      settings: { currency: "NGN", timezone: "Africa/Lagos" },
    });

    const { accessToken, refreshToken } = generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );

    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        business: {
          id: business._id,
          name: business.name,
          slug: business.slug,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error(`Register error: ${error}`);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user || !(await user.comparePassword(password))) {
      res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
      return;
    }

    if (!user.isActive) {
      res
        .status(403)
        .json({ success: false, message: "Account has been deactivated" });
      return;
    }

    const business = await Business.findOne({ owner: user._id });
    const { accessToken, refreshToken } = generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );
    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: getUserPublicData(user),
        business: getBusinessPublicData(business, true),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error}`);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res
        .status(401)
        .json({ success: false, message: "Refresh token required" });
      return;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || "refresh-secret",
    ) as {
      id: string;
    };
    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== token) {
      res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );
    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch {
    res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
};

export const logout = async (
  req: Request & { user?: { id: string } },
  res: Response,
): Promise<void> => {
  try {
    await User.findByIdAndUpdate(req.user?.id, { refreshToken: null });
    res.json({ success: true, message: "Logged out successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};
