import { Request, RequestHandler, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { generateSlug } from "../utils/helpers";
import User from "../models/profiles/user";
import Business from "../models/business";
import { AppError } from "../utils/AppError";
import { sendSuccess } from "../utils/api";

const generateTokens = (userId: string, email: string, role: string) => {
  const accessToken = jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET as string,
    {
      expiresIn: (process.env.JWT_EXPIRES_IN as string) || "7d",
    } as SignOptions,
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as string) || "30d",
    } as SignOptions,
  );
  return { accessToken, refreshToken };
};

export const register: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, businessName } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw AppError.conflict("Email already registered");
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

    sendSuccess(
      res,
      {
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
      "Registration successful",
      201,
    );
  },
);

export const login: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );

    if (!user || !(await user.comparePassword(password))) {
      throw AppError.unauthorized("Invalid email or password");
    }

    if (!user.isActive) {
      throw AppError.forbidden("Account has been deactivated");
    }

    const business = await Business.findOne({ owner: user._id });
    const { accessToken, refreshToken } = generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );
    await User.findByIdAndUpdate(user._id, { refreshToken });

    sendSuccess(
      res,
      {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        business: business
          ? { id: business._id, name: business.name, slug: business.slug }
          : null,
        accessToken,
        refreshToken,
      },
      "Login successful",
    );
  },
);

export const refreshToken: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { refreshToken: token } = req.body;
    if (!token) {
      throw AppError.unauthorized("Refresh token required");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || "refresh-secret",
    ) as {
      id: string;
    };

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== token) {
      throw AppError.unauthorized("Invalid refresh token");
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );
    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    sendSuccess(res, { accessToken, refreshToken: newRefreshToken });
  },
);

export const getMe: RequestHandler = asyncHandler(
  async (req: Request & { user?: { id: string } }, res: Response) => {
    const user = await User.findById(req.user?.id);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    const business = await Business.findOne({ owner: user._id });

    sendSuccess(res, {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      business: business
        ? {
            id: business._id,
            name: business.name,
            slug: business.slug,
            settings: business.settings,
          }
        : null,
    });
  },
);

export const logout: RequestHandler = asyncHandler(
  async (req: Request & { user?: { id: string } }, res: Response) => {
    await User.findByIdAndUpdate(req.user?.id, { refreshToken: null });
    sendSuccess(res, null, "Logged out successfully");
  },
);
