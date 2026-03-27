import { RequestHandler, Response } from "express";
import asyncHandler from "express-async-handler";
import { getBusinessId } from "../utils/profile";
import { AuthReq } from "../types/request";
import Transaction from "../models/billing/transaction";
import { sendSuccess } from "../utils/api";
import { AppError } from "../utils/AppError";

export const getTransactions: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
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
      const dateFilter: Record<string, unknown> = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      filter.createdAt = dateFilter;
    }

    const transactions = await Transaction.find(filter)
      .populate("customer", "firstName lastName email")
      .populate("product", "name type")
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .sort({ createdAt: -1 });

    sendSuccess(res, transactions, "Transactions fetched");
  },
);

export const getTransaction: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
    const businessId = await getBusinessId(req.user!.id);
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      business: businessId,
    })
      .populate("customer")
      .populate("product");

    if (!transaction) {
      throw AppError.notFound("Transaction not found");
    }

    sendSuccess(res, transaction);
  },
);
