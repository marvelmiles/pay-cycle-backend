import { Request, Response } from "express";
import {
  PaymentLink,
  Transaction,
  Subscription,
} from "../models/billing.models";
import { Business, Customer, Product } from "../models/core.models";
import { generateSlug, generateReference } from "../utils/helpers";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger";
import { generateTransactionRef } from "../utils/transaction";
import interswitchService from "../services/interswitch.service";
import {
  createErrorResponse,
  serializeErrorResponse,
  serializeSuccessResponse,
} from "../utils/api";
import { getAuthData } from "../utils/auth-data";

interface AuthReq extends Request {
  user?: { id: string };
}

// MAIN CODE

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

// AI GENERATED

const getBusinessId = async (userId: string) => {
  const biz = await Business.findOne({ owner: userId });
  return biz?._id?.toString();
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
      _id: req.params.id,
      business: businessId,
    }).populate(
      "product",
      "name price interval type currency features description",
    );
    if (!link) {
      res
        .status(404)
        .json({ success: false, message: "Payment link not found" });
      return;
    }
    res.json({ success: true, data: link });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payment link" });
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

    // Product is REQUIRED
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
      amount: product.price, // always taken from product
      currency: product.currency,
      isFixedAmount: true, // always fixed from product
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
    // Don't allow overriding amount/currency — always from product
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

// ==================== PUBLIC ROUTES (no auth) ====================

export const getPublicPaymentLink = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const link = await PaymentLink.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .populate("product")
      .populate("business", "name logo email settings");

    if (!link) {
      res.status(404).json({
        success: false,
        message: "Payment link not found or has been deactivated",
      });
      return;
    }
    if (link.expiresAt && link.expiresAt < new Date()) {
      res
        .status(410)
        .json({ success: false, message: "This payment link has expired" });
      return;
    }
    if (link.maxUses && link.useCount >= link.maxUses) {
      res.status(410).json({
        success: false,
        message: "This payment link has reached its maximum uses",
      });
      return;
    }

    res.json({ success: true, data: link });
  } catch (error) {
    logger.error(`Get public payment link error: ${error}`);
    res
      .status(500)
      .json({ success: false, message: "Failed to load payment page" });
  }
};

export const initiatePublicPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { slug } = req.params;
    const { firstName, lastName, email, phone } = req.body;

    if (!firstName || !lastName || !email) {
      res
        .status(400)
        .json({ success: false, message: "Name and email are required" });
      return;
    }

    const link = await PaymentLink.findOne({ slug, isActive: true })
      .populate("product")
      .populate("business", "name email settings");

    if (!link) {
      res
        .status(404)
        .json({ success: false, message: "Payment link not found" });
      return;
    }
    if (link.expiresAt && link.expiresAt < new Date()) {
      res.status(410).json({ success: false, message: "Payment link expired" });
      return;
    }

    const product = (link as any).product as InstanceType<typeof Product>;
    const business = (link as any).business as InstanceType<typeof Business>;

    // Upsert customer
    let customer = await Customer.findOne({
      business: business._id,
      email: email.toLowerCase(),
    });
    if (!customer) {
      customer = await Customer.create({
        business: business._id,
        email: email.toLowerCase(),
        firstName,
        lastName,
        phone,
      });
    }

    const reference = generateReference("PAY");

    // Create pending transaction immediately
    const transaction = await Transaction.create({
      business: business._id,
      customer: customer._id,
      product: product._id,
      amount: product.price,
      currency: product.currency,
      status: "pending",
      type: product.type,
      reference,
      metadata: { paymentLinkSlug: slug, paymentLinkId: link._id },
    });

    // Build Interswitch hosted fields config
    const interswitchConfig = {
      merchantCode: process.env.INTERSWITCH_CLIENT_ID!,
      payableCode: process.env.INTERSWITCH_PAYABLE_CODE!,
      transactionReference: reference,
      amount: product.price, // in kobo already
      currencyCode: "566",
      customerEmail: email,
      customerName: `${firstName} ${lastName}`,
      redirectUrl: `${process.env.APP_URL}/pay/${slug}/callback?ref=${reference}`,
      siteName: (business as unknown as { name: string }).name || "BillFlow",
      mode: process.env.NODE_ENV === "production" ? "LIVE" : "TEST",
    };

    res.status(201).json({
      success: true,
      data: {
        reference,
        transactionId: transaction._id,
        customer: { id: customer._id, firstName, lastName, email },
        interswitchConfig,
        product: {
          name: product.name,
          price: product.price,
          currency: product.currency,
          type: product.type,
          interval: product.interval,
        },
      },
    });
  } catch (error) {
    logger.error(`Initiate public payment error: ${error}`);
    res
      .status(500)
      .json({ success: false, message: "Failed to initiate payment" });
  }
};

export const verifyPublicPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { reference } = req.params;

    const transaction = await Transaction.findOne({ reference })
      .populate("product")
      .populate("business");
    if (!transaction) {
      res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
      return;
    }

    if (transaction.status === "successful") {
      res.json({ success: true, data: transaction });
      return;
    }

    // In production: call Interswitch verify API
    // For sandbox/dev we simulate success based on query param from redirect
    const { status: queryStatus } = req.query;
    const isSuccess =
      queryStatus === "success" || process.env.NODE_ENV !== "production";

    if (isSuccess) {
      transaction.status = "successful";
      transaction.interswitchRef = `ISW-${Date.now()}`;
      await transaction.save();

      // Update customer total spent
      await Customer.findByIdAndUpdate(transaction.customer, {
        $inc: { totalSpent: transaction.amount },
      });

      // Increment payment link use count
      await PaymentLink.findOneAndUpdate(
        { "metadata.paymentLinkId": transaction.metadata?.paymentLinkId },
        { $inc: { useCount: 1 } },
      );
      // Also update by slug from metadata
      if (transaction.metadata?.paymentLinkSlug) {
        await PaymentLink.findOneAndUpdate(
          { slug: transaction.metadata.paymentLinkSlug as string },
          { $inc: { useCount: 1 } },
        );
      }

      // Create subscription if recurring
      const product = (transaction as any).product as InstanceType<
        typeof Product
      >;
      if (product?.type === "recurring") {
        const now = new Date();
        const periodEnd = new Date(now);
        if (product.interval === "monthly")
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        else if (product.interval === "yearly")
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        else if (product.interval === "weekly")
          periodEnd.setDate(periodEnd.getDate() + 7);
        else if (product.interval === "daily")
          periodEnd.setDate(periodEnd.getDate() + 1);

        const existingSub = await Subscription.findOne({
          customer: transaction.customer,
          product: product._id,
          status: { $in: ["active", "trialing"] },
        });

        if (!existingSub) {
          await Subscription.create({
            business: transaction.business,
            customer: transaction.customer,
            product: product._id,
            status: product.trialDays ? "trialing" : "active",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            trialEnd: product.trialDays
              ? new Date(now.getTime() + product.trialDays * 86400000)
              : undefined,
          });
        }
      }
    } else {
      transaction.status = "failed";
      transaction.failureReason = "Payment was not completed";
      await transaction.save();
    }

    res.json({
      success: true,
      data: {
        status: transaction.status,
        reference,
        amount: transaction.amount,
      },
    });
  } catch (error) {
    logger.error(`Verify public payment error: ${error}`);
    res
      .status(500)
      .json({ success: false, message: "Failed to verify payment" });
  }
};
