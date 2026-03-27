import { Response } from "express";
import { createErrorResponse } from "../utils/api";
import { AuthReq } from "../types/request";
import Withdraw from "../models/withdrawal";
import Transaction from "../models/billing/transaction";
import Business from "../models/business";
import { getBusinessId, getBusinessPublicData } from "../utils/profile";

export const getWalletDetails = async (req: AuthReq, res: Response) => {
  try {
    const businessId = await getBusinessId(req.user?.id || "");

    const [pendingBalance, totalWithdrawn, totalEarned] = await Promise.all([
      Withdraw.aggregate([
        { $match: { business: businessId, status: "pending" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Withdraw.aggregate([
        { $match: { business: businessId, status: "successful" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { business: businessId, status: "successful" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        pendingBalance: pendingBalance[0]?.total || 0,
        totalWithdrawn: totalWithdrawn[0]?.total || 0,
        totalEarned: totalEarned[0]?.total || 0,
      },
    });
  } catch (err) {
    createErrorResponse(res, err);
  }
};

export const createWithdrawRequest = async (req: AuthReq, res: Response) => {
  try {
    const data = await Withdraw.create({
      amount: req.body.amount,
      business: req.params.businessId,
      note: req.body.note,
    });

    const business = await Business.findById(req.params.businessId);

    const newBusiness = await Business.findByIdAndUpdate(
      req.params.businessId,
      {
        availableBalance: Math.max(
          (business?.availableBalance || 0) - data.amount,
          0,
        ),
      },
      { new: true },
    );

    res.json({
      success: true,
      data: {
        withdraw: data,
        business: newBusiness ? getBusinessPublicData(newBusiness, true) : null,
      },
      message: "Withdrawal request received",
    });
  } catch (err) {
    createErrorResponse(res, err);
  }
};

export const getWithdrawals = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      startDate,
      endDate,
    } = req.query;

    const filter: Record<string, unknown> = {
      business: req.params.businessId,
    };
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

    const [pendingWithdrawals, total] = await Promise.all([
      Withdraw.find(filter)
        .populate("business")
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .sort({ createdAt: -1 }),
      Withdraw.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: pendingWithdrawals,
      pagination: {
        total,
        page: +page,
        limit: +limit,
        pages: Math.ceil(total / +limit),
      },
    });
  } catch (error) {
    createErrorResponse(res, error, {
      logMsg: `Get withdrawals ${req.query?.status || ""}`,
    });
  }
};

export const cancelWithdrawalRequest = async (req: AuthReq, res: Response) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      res.status(404).json({
        message: "Transaction not found",
        success: false,
      });
      return;
    }

    await withdraw.updateOne({
      status: "cancelled",
    });

    const business = await Business.findById(req.params.businessId);

    const newBusiness = await Business.findByIdAndUpdate(
      req.params.businessId,
      {
        availableBalance: (business?.availableBalance || 0) + withdraw.amount,
      },
      {
        new: true,
      },
    );

    res.json({
      business: newBusiness,
      message: "Withdrawal request cancelled",
    });
  } catch (err) {
    createErrorResponse(res, err);
  }
};
