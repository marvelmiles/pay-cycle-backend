import { Request, Response } from "express";
import { Transaction, Subscription } from "../models/billing.models";
import { Customer, Business, Product } from "../models/core.models";
import { generateReference } from "../utils/helpers";
import logger from "../utils/logger";

interface AuthReq extends Request {
  user?: { id: string };
}

const getBusinessId = async (userId: string) => {
  const biz = await Business.findOne({ owner: userId });
  return biz?._id?.toString();
};

export const getTransactions = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const {
      page = 1,
      limit = 20,
      status,
      type,
      startDate,
      endDate,
    } = req.query;

    const filter: Record<string, unknown> = { business: businessId };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate)
        (filter.createdAt as Record<string, unknown>).$gte = new Date(
          startDate as string,
        );
      if (endDate)
        (filter.createdAt as Record<string, unknown>).$lte = new Date(
          endDate as string,
        );
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("customer", "firstName lastName email")
        .populate("product", "name type")
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .sort({ createdAt: -1 }),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: +page,
        limit: +limit,
        pages: Math.ceil(total / +limit),
      },
    });
  } catch (error) {
    logger.error(`Get transactions error: ${error}`);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch transactions" });
  }
};

export const getTransaction = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      business: businessId,
    })
      .populate("customer")
      .populate("product");
    if (!transaction) {
      res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
      return;
    }
    res.json({ success: true, data: transaction });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch transaction" });
  }
};

export const initiatePayment = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const { customerId, productId, metadata } = req.body;

    const [customer, product] = await Promise.all([
      Customer.findOne({ _id: customerId, business: businessId }),
      Product.findOne({ _id: productId, business: businessId }),
    ]);

    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }

    const reference = generateReference("TXN");
    const transaction = await Transaction.create({
      business: businessId,
      customer: customerId,
      product: productId,
      amount: product.price,
      currency: product.currency,
      status: "pending",
      type: product.type,
      reference,
      metadata,
    });

    // In production, this would call Interswitch to get payment URL
    const paymentUrl = `${process.env.APP_URL}/pay/${reference}`;

    res.status(201).json({
      success: true,
      message: "Payment initiated",
      data: { transaction, paymentUrl, reference },
    });
  } catch (error) {
    logger.error(`Initiate payment error: ${error}`);
    res
      .status(500)
      .json({ success: false, message: "Failed to initiate payment" });
  }
};

export const verifyPayment = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const { reference } = req.params;

    const transaction = await Transaction.findOne({
      reference,
      business: businessId,
    });
    if (!transaction) {
      res
        .status(404)
        .json({ success: false, message: "Transaction not found" });
      return;
    }

    // In production, verify with Interswitch API
    // For now, simulate verification
    const isSuccessful = true; // Would be from Interswitch response

    if (isSuccessful && transaction.status === "pending") {
      transaction.status = "successful";
      await transaction.save();

      // Update customer total spent
      await Customer.findByIdAndUpdate(transaction.customer, {
        $inc: { totalSpent: transaction.amount },
      });

      // Create subscription if recurring product
      const product = await Product.findById(transaction.product);
      if (product?.type === "recurring") {
        const now = new Date();
        const periodEnd = new Date(now);
        if (product.interval === "monthly")
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        else if (product.interval === "yearly")
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        else if (product.interval === "weekly")
          periodEnd.setDate(periodEnd.getDate() + 7);

        await Subscription.create({
          business: businessId,
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

    res.json({ success: true, data: transaction });
  } catch (error) {
    logger.error(`Verify payment error: ${error}`);
    res
      .status(500)
      .json({ success: false, message: "Failed to verify payment" });
  }
};
