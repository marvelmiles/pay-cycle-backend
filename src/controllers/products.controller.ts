import { Request, Response } from 'express';
import { Product } from '../models/core.models';
import { Business } from '../models/core.models';
import logger from '../utils/logger';

interface AuthReq extends Request {
  user?: { id: string; email: string; role: string };
}

const getBusinessId = async (userId: string) => {
  const biz = await Business.findOne({ owner: userId });
  return biz?._id?.toString();
};

export const getProducts = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const { page = 1, limit = 20, type, isActive } = req.query;
    const filter: Record<string, unknown> = { business: businessId };
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const [products, total] = await Promise.all([
      Product.find(filter)
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) },
    });
  } catch (error) {
    logger.error(`Get products error: ${error}`);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
};

export const getProduct = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const product = await Product.findOne({ _id: req.params.id, business: businessId });
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const product = await Product.create({ ...req.body, business: businessId });
    res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (error) {
    logger.error(`Create product error: ${error}`);
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

export const updateProduct = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, business: businessId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product updated', data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, business: businessId },
      { isActive: false },
      { new: true }
    );
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, message: 'Product deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};
