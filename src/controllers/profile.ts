import { Request, Response } from "express";
import { createErrorResponse } from "../utils/api";
import User from "../models/profiles/user";
import Business from "../models/business";
import { AuthReq } from "../types/request";
import { uploadToCloudinary } from "../utils/stream";
import { getBusinessPublicData, getUserPublicData } from "../utils/profile";

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
        user: getUserPublicData(user),
        business: getBusinessPublicData(business, true),
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

    const newUser = await User.findByIdAndUpdate(
      user._id,

      {
        firstName: req.body.firstName || user.firstName,
        lastName: req.body.lastName || user.lastName,
        image: fileObj?.secure_url || user.image,
      },
      {
        new: true,
      },
    );

    res.json({
      success: true,
      data: newUser,
      message: "Profile updated successfully",
    });
  } catch (err) {
    createErrorResponse(res, err);
  }
};

export const updateProfileBussiness = async (req: AuthReq, res: Response) => {
  try {
    const business = await Business.findById(req.params.id);

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

    const newBusiness = await Business.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name || business.name,
        slug: req.body.slug || business.slug,
        image: fileObj?.secure_url || business.image,
        bank: req.body.bank || business.bank,
      },
      { new: true },
    );

    res.json({
      success: true,
      data: newBusiness,
      message: "Business account updated successfully",
    });
  } catch (err) {
    createErrorResponse(res, err);
  }
};
