import { Request, Response } from "express";
import { createErrorResponse } from "../utils/api";
import User from "../models/profiles/user";
import Business from "../models/business";
import { AuthReq } from "../types/request";
import { uploadToCloudinary } from "../utils/stream";

export const getProfile = async (
  req: Request & { user?: { id: string } },
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    const business = await Business.findOne({ owner: user._id });

    res.json({
      success: true,
      data: {
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
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get user" });
  }
};

export const updateProfile = async (req: AuthReq, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Profile not found",
      });
      return;
    }

    let fileObj: any;

    if (req.file) {
      fileObj = await uploadToCloudinary(req.file.buffer);
    }

    await User.updateOne(
      {
        _id: user._id,
      },
      {
        firstName: req.body.firstName || user.firstName,
        lastName: req.body.lastName || user.lastName,
        image: fileObj?.secure_url || user.image,
      },
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (err) {
    createErrorResponse(res, err);
  }
};

export const updateProfileBussiness = async (req: AuthReq, res: Response) => {
  try {
    const business = await Business.findOne({ owner: req.user?.id });

    if (!business) {
      res.status(404).json({
        success: false,
        message: "Business acount not found",
      });
      return;
    }

    let fileObj: any;

    if (req.file) {
      fileObj = await uploadToCloudinary(req.file.buffer);
    }

    await Business.updateOne(
      {
        owner: req.user?.id,
      },
      {
        name: req.body.name || business.name,
        slug: req.body.slug || business.slug,
        image: fileObj?.secure_url || business.image,
      },
    );

    res.json({
      success: true,
      message: "Business account updated successfully",
    });
  } catch (err) {
    createErrorResponse(res, err);
  }
};
