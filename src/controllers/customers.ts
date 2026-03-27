import { Request, RequestHandler, Response } from "express";
import asyncHandler from "express-async-handler";
import { getBusinessId } from "../utils/profile";
import Customer from "../models/profiles/customer";
import Transaction from "../models/billing/transaction";
import { sendSuccess } from "../utils/api";
import { AppError } from "../utils/AppError";

interface AuthReq extends Request {
  user?: { id: string };
}

export const getCustomers: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
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

    const customers = await Customer.find(filter)
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .sort({ createdAt: -1 });

    sendSuccess(res, customers, "Customers fetched");
  },
);

export const getCustomer: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
    const businessId = await getBusinessId(req.user!.id);
    const customer = await Customer.findOne({
      _id: req.params.id,
      business: businessId,
    });

    if (!customer) {
      throw AppError.notFound("Customer not found");
    }

    const transactions = await Transaction.find({ customer: customer._id })
      .sort({ createdAt: -1 })
      .limit(10);

    sendSuccess(res, { customer, transactions });
  },
);

export const createCustomer: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
    const businessId = await getBusinessId(req.user!.id);
    const existing = await Customer.findOne({
      business: businessId,
      email: req.body.email,
    });

    if (existing) {
      throw AppError.conflict("Customer with this email already exists");
    }

    const customer = await Customer.create({
      ...req.body,
      business: businessId,
    });

    sendSuccess(res, customer, "Customer created", 201);
  },
);

export const updateCustomer: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
    const businessId = await getBusinessId(req.user!.id);
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, business: businessId },
      req.body,
      { new: true },
    );

    if (!customer) {
      throw AppError.notFound("Customer not found");
    }

    sendSuccess(res, customer, "Customer updated");
  },
);
