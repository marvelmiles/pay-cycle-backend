import { Request, Response } from "express";
import { ApiToken, WebhookLog } from "../models/billing.models";
import { Business } from "../models/core.models";
import { generateApiToken, hashToken } from "../utils/helpers";
import logger from "../utils/logger";

interface AuthReq extends Request {
  user?: { id: string };
}

// Basic SUtJQTI2NzQyNjdGN0JDOUZGOUVGMjRFRjdBOTU0NDYyRERGQ0MxN0JCRjc6SW0yX0Z3dXN0ellHdlFL

const getBusinessId = async (userId: string) => {
  const biz = await Business.findOne({ owner: userId });
  return biz?._id?.toString();
};

export const getApiTokens = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const tokens = await ApiToken.find({ business: businessId, isActive: true })
      .select("-token -hashedToken")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tokens });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch API tokens" });
  }
};

export const createApiToken = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const { name, type = "test", permissions = [], expiresAt } = req.body;

    const rawToken = generateApiToken();
    const hashedToken = hashToken(rawToken);

    const apiToken = await ApiToken.create({
      business: businessId,
      name,
      token: rawToken, // stored encrypted in production
      hashedToken,
      type,
      permissions,
      expiresAt,
    });

    // Return raw token only once
    res.status(201).json({
      success: true,
      message:
        "API token created. Save this token — it will not be shown again.",
      data: {
        id: apiToken._id,
        name: apiToken.name,
        type: apiToken.type,
        token: rawToken,
        createdAt: apiToken.createdAt,
      },
    });
  } catch (error) {
    logger.error(`Create API token error: ${error}`);
    res
      .status(500)
      .json({ success: false, message: "Failed to create API token" });
  }
};

export const revokeApiToken = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const token = await ApiToken.findOneAndUpdate(
      { _id: req.params.id, business: businessId },
      { isActive: false },
      { new: true },
    );
    if (!token) {
      res.status(404).json({ success: false, message: "API token not found" });
      return;
    }
    res.json({ success: true, message: "API token revoked" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to revoke token" });
  }
};

export const getWebhookLogs = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const { page = 1, limit = 20 } = req.query;

    const [logs, total] = await Promise.all([
      WebhookLog.find({ business: businessId })
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .sort({ createdAt: -1 }),
      WebhookLog.countDocuments({ business: businessId }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: +page,
        limit: +limit,
        pages: Math.ceil(total / +limit),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch webhook logs" });
  }
};

export const updateWebhookSettings = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const { webhookUrl, webhookSecret } = req.body;
    const business = await Business.findOneAndUpdate(
      { owner: req.user!.id },
      {
        "settings.webhookUrl": webhookUrl,
        "settings.webhookSecret": webhookSecret,
      },
      { new: true },
    );
    if (!business) {
      res.status(404).json({ success: false, message: "Business not found" });
      return;
    }
    res.json({
      success: true,
      message: "Webhook settings updated",
      data: business.settings,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update webhook settings" });
  }
};
