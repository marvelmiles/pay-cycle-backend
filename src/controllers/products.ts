import { Request, RequestHandler, Response } from "express";
import asyncHandler from "express-async-handler";
import Product from "../models/product";
import { getBusinessId } from "../utils/profile";
import { sendSuccess } from "../utils/api";
import { AppError } from "../utils/AppError";

interface AuthReq extends Request {
  user?: { id: string; email: string; role: string };
}

export const getProducts: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
    const businessId = await getBusinessId(req.user!.id);
    const { page = 1, limit = 20, type, isActive } = req.query;
    const filter: Record<string, unknown> = { business: businessId };
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const products = await Product.find(filter)
      .skip((+page - 1) * +limit)
      .limit(+limit)
      .sort({ createdAt: -1 });

    sendSuccess(res, products, "Products fetched");
  },
);

export const getProduct: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
    const businessId = await getBusinessId(req.user!.id);
    const product = await Product.findOne({
      _id: req.params.id,
      business: businessId,
    });

    if (!product) {
      throw AppError.notFound("Product not found");
    }

    sendSuccess(res, product);
  },
);

export const createProduct: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
    const businessId = await getBusinessId(req.user!.id);
    const product = await Product.create({ ...req.body, business: businessId });
    sendSuccess(res, product, "Product created", 201);
  },
);

export const updateProduct: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
    const businessId = await getBusinessId(req.user!.id);
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, business: businessId },
      req.body,
      { new: true, runValidators: true },
    );

    if (!product) {
      throw AppError.notFound("Product not found");
    }

    sendSuccess(res, product, "Product updated");
  },
);

export const deleteProduct: RequestHandler = asyncHandler(
  async (req: AuthReq, res: Response) => {
    const businessId = await getBusinessId(req.user!.id);
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, business: businessId },
      { isActive: false },
      { new: true },
    );

    if (!product) {
      throw AppError.notFound("Product not found");
    }

    sendSuccess(res, null, "Product deactivated");
  },
);
