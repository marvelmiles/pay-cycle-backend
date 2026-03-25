import { Request, Response } from "express";
import { Customer } from "../models/core.models";
import { Transaction, Subscription } from "../models/billing.models";
import logger from "../utils/logger";
import { getBusinessId } from "../utils/profile";

interface AuthReq extends Request {
  user?: { id: string };
}

export const getCustomers = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const { page = 1, limit = 20, search } = req.query;
    const filter: Record<string, unknown> = { business: businessId };
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    const [customers, total] = await Promise.all([
      Customer.find(filter)
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .sort({ createdAt: -1 }),
      Customer.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: +page,
        limit: +limit,
        pages: Math.ceil(total / +limit),
      },
    });
  } catch (error) {
    logger.error(`Get customers error: ${error}`);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch customers" });
  }
};

export const getCustomer = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const customer = await Customer.findOne({
      _id: req.params.id,
      business: businessId,
    });
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }

    const [transactions, subscriptions] = await Promise.all([
      Transaction.find({ customer: customer._id })
        .sort({ createdAt: -1 })
        .limit(10),
      Subscription.find({ customer: customer._id })
        .populate("product")
        .sort({ createdAt: -1 }),
    ]);

    res.json({
      success: true,
      data: { customer, transactions, subscriptions },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch customer" });
  }
};

export const createCustomer = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const existing = await Customer.findOne({
      business: businessId,
      email: req.body.email,
    });
    if (existing) {
      res.status(409).json({
        success: false,
        message: "Customer with this email already exists",
      });
      return;
    }
    const customer = await Customer.create({
      ...req.body,
      business: businessId,
    });
    res
      .status(201)
      .json({ success: true, message: "Customer created", data: customer });
  } catch (error) {
    logger.error(`Create customer error: ${error}`);
    res
      .status(500)
      .json({ success: false, message: "Failed to create customer" });
  }
};

export const updateCustomer = async (
  req: AuthReq,
  res: Response,
): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, business: businessId },
      req.body,
      { new: true },
    );
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }
    res.json({ success: true, message: "Customer updated", data: customer });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update customer" });
  }
};
