import { Request, Response } from 'express';
import { Subscription } from '../models/billing.models';
import { Business } from '../models/core.models';
import logger from '../utils/logger';

interface AuthReq extends Request {
  user?: { id: string };
}

const getBusinessId = async (userId: string) => {
  const biz = await Business.findOne({ owner: userId });
  return biz?._id?.toString();
};

export const getSubscriptions = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const { page = 1, limit = 20, status } = req.query;
    const filter: Record<string, unknown> = { business: businessId };
    if (status) filter.status = status;

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate('customer', 'firstName lastName email')
        .populate('product', 'name price interval currency')
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .sort({ createdAt: -1 }),
      Subscription.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: subscriptions,
      pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) },
    });
  } catch (error) {
    logger.error(`Get subscriptions error: ${error}`);
    res.status(500).json({ success: false, message: 'Failed to fetch subscriptions' });
  }
};

export const getSubscription = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const subscription = await Subscription.findOne({ _id: req.params.id, business: businessId })
      .populate('customer')
      .populate('product');
    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }
    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
  }
};

export const cancelSubscription = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const { cancelAtPeriodEnd = true } = req.body;

    const subscription = await Subscription.findOne({ _id: req.params.id, business: businessId });
    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }
    if (subscription.status === 'cancelled') {
      res.status(400).json({ success: false, message: 'Subscription already cancelled' });
      return;
    }

    if (cancelAtPeriodEnd) {
      subscription.cancelAtPeriodEnd = true;
    } else {
      subscription.status = 'cancelled';
      subscription.cancelledAt = new Date();
    }
    await subscription.save();

    res.json({ success: true, message: 'Subscription cancelled', data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel subscription' });
  }
};

export const pauseSubscription = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, business: businessId, status: 'active' },
      { status: 'paused' },
      { new: true }
    );
    if (!subscription) {
      res.status(404).json({ success: false, message: 'Active subscription not found' });
      return;
    }
    res.json({ success: true, message: 'Subscription paused', data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to pause subscription' });
  }
};

export const resumeSubscription = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const businessId = await getBusinessId(req.user!.id);
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, business: businessId, status: 'paused' },
      { status: 'active' },
      { new: true }
    );
    if (!subscription) {
      res.status(404).json({ success: false, message: 'Paused subscription not found' });
      return;
    }
    res.json({ success: true, message: 'Subscription resumed', data: subscription });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to resume subscription' });
  }
};
