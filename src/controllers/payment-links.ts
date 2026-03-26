import { Request, Response } from "express";
import { generateSlug } from "../utils/helpers";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger";
import { generateTransactionRef } from "../utils/transaction";
import {
  createErrorResponse,
  serializeErrorResponse,
  serializeSuccessResponse,
} from "../utils/api";
import { getAuthData } from "../utils/auth-data";
import { getBusinessId } from "../utils/profile";
import { AuthReq } from "../types/request";
import PaymentLink from "../models/billing/payment-link";
import Product from "../models/product";
import interswitchService from "../services/interswitch";

export const handleCardPayment = async (req: Request, res: Response) => {
  try {
    const {
      cardDetails,
      amount,
      customerDetails,
      paymentType,
      businessId,
      productId,
    } = req.body;

    const data = {
      paymentType,
      amount,
      customerId: customerDetails.email,
      currency: "NGN",
      transactionRef: generateTransactionRef(),
      authData: getAuthData({
        cvv: cardDetails.cvv,
        expDate: cardDetails.exp_date,
        pan: cardDetails.pan,
        pin: cardDetails.pin,
      }),
      customer: customerDetails,
      businessId,
      productId,
    };

    const result = await interswitchService.initiateCardPayment(data);

    res.json(serializeSuccessResponse(result));
  } catch (error) {
    createErrorResponse(res, error);
  }
};

export const verifyPaymentOtp = async (req: Request, res: Response) => {
  const { paymentId, otp, transactionId } = req.body;
  try {
    const result = await interswitchService.verifyPaymentOtp({
      paymentId,
      otp,
      transactionId,
    });

    res.json(serializeSuccessResponse(result));
  } catch (err) {
    createErrorResponse(res, err);
  }
};

export const confirmPayment = async (req: Request, res: Response) => {
  try {
    const result = await interswitchService.confirmPayment(req.query as any);

    res.json(serializeSuccessResponse(result));
  } catch (err) {
    res.status(500).json(serializeErrorResponse(err));
  }
};

export const getPaymentLinks = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const { page = 1, limit = 20, isActive } = req.query;
    const filter: Record<string, unknown> = { business: businessId };
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const [links, total] = await Promise.all([
      PaymentLink.find(filter)
        .populate(
          "product",
          "name price interval type currency features description",
        )
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .sort({ createdAt: -1 }),
      PaymentLink.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: links,
      pagination: {
        total,
        page: +page,
        limit: +limit,
        pages: Math.ceil(total / +limit),
      },
    });
  } catch (error) {
    logger.error(`Get payment links error: ${error}`);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payment links" });
  }
};

export const getPaymentLink = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const link = await PaymentLink.findOne({
      slug: req.params.slug,
      business: businessId,
    })
      .populate(
        "product",
        "name price interval type currency features description",
      )
      .populate("business");
    if (!link) {
      res
        .status(404)
        .json({ success: false, message: "Payment link not found" });
      return;
    }
    res.json({ success: true, data: link });
  } catch (error) {
    createErrorResponse(res, error);
  }
};

export const createPaymentLink = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const { title, productId, description, redirectUrl, maxUses, expiresAt } =
      req.body;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "A product must be selected to create a payment link",
      });
      return;
    }

    const product = await Product.findOne({
      _id: productId,
      business: businessId,
      isActive: true,
    });
    if (!product) {
      res
        .status(404)
        .json({ success: false, message: "Product not found or inactive" });
      return;
    }

    let slug = generateSlug(title) + "-" + uuidv4().substring(0, 6);
    const existing = await PaymentLink.findOne({ slug });
    if (existing) slug = slug + "-" + Date.now();

    const link = await PaymentLink.create({
      business: businessId,
      product: productId,
      title,
      description: description || product.description,
      amount: product.price,
      currency: product.currency,
      isFixedAmount: true,
      slug,
      isActive: true,
      redirectUrl,
      maxUses,
      expiresAt,
    });

    const populated = await link.populate(
      "product",
      "name price interval type currency features description",
    );
    const paymentUrl = `${process.env.APP_URL}/pay/${slug}`;

    res.status(201).json({
      success: true,
      message: "Payment link created",
      data: { ...populated.toObject(), paymentUrl },
    });
  } catch (error) {
    logger.error(`Create payment link error: ${error}`);
    res
      .status(500)
      .json({ success: false, message: "Failed to create payment link" });
  }
};

export const updatePaymentLink = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);

    const { amount, currency, isFixedAmount, ...safeUpdates } = req.body;
    void amount;
    void currency;
    void isFixedAmount;

    const link = await PaymentLink.findOneAndUpdate(
      { _id: req.params.id, business: businessId },
      safeUpdates,
      { new: true },
    ).populate("product", "name price interval type currency features");

    if (!link) {
      res
        .status(404)
        .json({ success: false, message: "Payment link not found" });
      return;
    }
    res.json({ success: true, message: "Payment link updated", data: link });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update payment link" });
  }
};

export const deletePaymentLink = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const link = await PaymentLink.findOneAndUpdate(
      { _id: req.params.id, business: businessId },
      { isActive: false },
      { new: true },
    );
    if (!link) {
      res
        .status(404)
        .json({ success: false, message: "Payment link not found" });
      return;
    }
    res.json({ success: true, message: "Payment link deactivated" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete payment link" });
  }
};
