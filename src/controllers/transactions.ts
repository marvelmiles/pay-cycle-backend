import { Response } from "express";
import logger from "../utils/logger";
import { getBusinessId } from "../utils/profile";
import { AuthReq } from "../types/request";
import Transaction from "../models/billing/transaction";

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
