import { Request, Response } from "express";
import logger from "../utils/logger";
import { getBusinessId } from "../utils/profile";
import Transaction from "../models/billing/transaction";
import Customer from "../models/profiles/customer";

interface AuthReq extends Request {
  user?: { id: string };
}

export const getDashboardAnalytics = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id, false);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalRevenue,
      monthRevenue,
      lastMonthRevenue,
      totalCustomers,
      newCustomersThisMonth,
      failedPayments,
      successfulPayments,
      recentTransactions,
      failedPaymentsThisMonth,
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: { business: businessId, status: "successful" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            business: businessId,
            status: "successful",
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            business: businessId,
            status: "successful",
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Customer.countDocuments({ business: businessId }),
      Customer.countDocuments({
        business: businessId,
        createdAt: { $gte: startOfMonth },
      }),
      Transaction.countDocuments({ business: businessId, status: "failed" }),
      Transaction.countDocuments({
        business: businessId,
        status: "successful",
      }),
      Transaction.find({ business: businessId })
        .populate("customer", "firstName lastName email")
        .populate("product", "name")
        .sort({ createdAt: -1 })
        .limit(5),
      Transaction.countDocuments({
        business: businessId,
        status: "failed",
        createdAt: { $gte: startOfMonth },
      }),
    ]);

    const currentMonthRevenue = monthRevenue[0]?.total || 0;
    const prevMonthRevenue = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth =
      prevMonthRevenue > 0
        ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
        : 0;

    const totalTxns = failedPayments + successfulPayments;
    const paymentSuccessRate =
      totalTxns > 0 ? (successfulPayments / totalTxns) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        monthRevenue: currentMonthRevenue,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        totalCustomers,
        newCustomersThisMonth,
        failedPayments,
        failedPaymentsThisMonth,
        paymentSuccessRate: Math.round(paymentSuccessRate * 100) / 100,
        recentTransactions,
      },
    });
  } catch (error) {
    logger.error(`Analytics error: ${error}`);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch analytics" });
  }
};

export const getDashboardStats = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id, false);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalRevenue,
      monthRevenue,
      lastMonthRevenue,
      totalCustomers,
      newCustomersThisMonth,
      failedPayments,
      successfulPayments,
      recentTransactions,
      failedPaymentsThisMonth,
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: { business: businessId, status: "successful" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            business: businessId,
            status: "successful",
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            business: businessId,
            status: "successful",
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Customer.countDocuments({ business: businessId }),
      Customer.countDocuments({
        business: businessId,
        createdAt: { $gte: startOfMonth },
      }),
      Transaction.countDocuments({ business: businessId, status: "failed" }),
      Transaction.countDocuments({
        business: businessId,
        status: "successful",
      }),
      Transaction.find({ business: businessId })
        .populate("customer", "firstName lastName email")
        .populate("product", "name")
        .sort({ createdAt: -1 })
        .limit(5),
      Transaction.countDocuments({
        business: businessId,
        status: "failed",
        createdAt: { $gte: startOfMonth },
      }),
    ]);

    const currentMonthRevenue = monthRevenue[0]?.total || 0;
    const prevMonthRevenue = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth =
      prevMonthRevenue > 0
        ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
        : 0;

    const totalTxns = failedPayments + successfulPayments;
    const paymentSuccessRate =
      totalTxns > 0 ? (successfulPayments / totalTxns) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        monthRevenue: currentMonthRevenue,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        totalCustomers,
        newCustomersThisMonth,
        failedPayments,
        paymentSuccessRate: Math.round(paymentSuccessRate * 100) / 100,
        recentTransactions,
        failedPaymentsThisMonth,
      },
    });
  } catch (error) {
    logger.error(`Analytics error: ${error}`);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch analytics" });
  }
};

export const getRevenueChart = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id, false);
    const { period = "monthly", months = 6 } = req.query;
    const since = new Date();
    since.setMonth(since.getMonth() - +months);

    const groupFormat = period === "daily" ? "%Y-%m-%d" : "%Y-%m";

    const revenueData = await Transaction.aggregate([
      {
        $match: {
          business: businessId,
          status: "successful",
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: revenueData });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch revenue chart" });
  }
};
