import { Request, RequestHandler, Response } from "express";
import asyncHandler from "express-async-handler";
import { generateSlug } from "../utils/helpers";
import { v4 as uuidv4 } from "uuid";
import { generateTransactionRef } from "../utils/transaction";
import { sendSuccess } from "../utils/api";
import { getAuthData } from "../utils/auth-data";
import { getBusinessId } from "../utils/profile";
import { AuthReq } from "../types/request";
import PaymentLink from "../models/billing/payment-link";
import Product from "../models/product";
import interswitchService from "../services/interswitch";
import { AppError } from "../utils/AppError";

export const handleCardPayment: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
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
    sendSuccess(res, result);
  },
);

export const verifyPaymentOtp: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { paymentId, otp, transactionId } = req.body;
    const result = await interswitchService.verifyPaymentOtp({
      paymentId,
      otp,
      transactionId,
    });

    sendSuccess(res, result);
  },
);

export const confirmPayment: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await interswitchService.confirmPayment(req.query as any);
    sendSuccess(res, result);
  },
);

export const getPaymentLinks: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
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

    sendSuccess(res, links, "Payment links fetched", 200);
    // Note: Pagination info could be added to sendSuccess if needed,
    // but for now I'm sticking to the plain data for consistency with current logic
    // unless we want to standardize pagination too.
  },
);

export const getPaymentLink: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
    const businessId = await getBusinessId(req.user!.id);
    const link = await PaymentLink.findOne({
      _id: req.params.id,
      business: businessId,
    }).populate(
      "product",
      "name price interval type currency features description",
    );

    if (!link) {
      throw AppError.notFound("Payment link not found");
    }

    sendSuccess(res, link);
  },
);

export const createPaymentLink: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
    const businessId = await getBusinessId(req.user!.id);
    const { title, productId, description, redirectUrl, maxUses, expiresAt } =
      req.body;

    if (!productId) {
      throw AppError.badRequest(
        "A product must be selected to create a payment link",
      );
    }

    const product = await Product.findOne({
      _id: productId,
      business: businessId,
      isActive: true,
    });

    if (!product) {
      throw AppError.notFound("Product not found or inactive");
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

    sendSuccess(
      res,
      { ...populated.toObject(), paymentUrl },
      "Payment link created",
      201,
    );
  },
);

export const updatePaymentLink: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
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
      throw AppError.notFound("Payment link not found");
    }

    sendSuccess(res, link, "Payment link updated");
  },
);

export const deletePaymentLink: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
    const businessId = await getBusinessId(req.user!.id);
    const link = await PaymentLink.findOneAndUpdate(
      { _id: req.params.id, business: businessId },
      { isActive: false },
      { new: true },
    );

    if (!link) {
      throw AppError.notFound("Payment link not found");
    }

    sendSuccess(res, null, "Payment link deactivated");
  },
);
