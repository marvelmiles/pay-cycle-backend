import axios from 'axios';
import { Business } from '../models/core.models';
import { WebhookLog } from '../models/billing.models';
import { generateWebhookSignature } from '../utils/helpers';
import logger from '../utils/logger';

export type WebhookEvent =
  | 'payment.successful'
  | 'payment.failed'
  | 'subscription.created'
  | 'subscription.cancelled'
  | 'subscription.renewed'
  | 'subscription.paused'
  | 'subscription.past_due'
  | 'customer.created';

interface WebhookPayload {
  event: WebhookEvent;
  data: Record<string, unknown>;
  businessId: string;
  timestamp: string;
}

export const dispatchWebhook = async (
  businessId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> => {
  try {
    const business = await Business.findById(businessId);
    if (!business?.settings?.webhookUrl) return;

    const payload: WebhookPayload = {
      event,
      data,
      businessId,
      timestamp: new Date().toISOString(),
    };

    const payloadStr = JSON.stringify(payload);
    const signature = generateWebhookSignature(
      payloadStr,
      business.settings.webhookSecret || process.env.WEBHOOK_SECRET || ''
    );

    const log = await WebhookLog.create({
      business: businessId,
      event,
      payload,
      status: 'pending',
    });

    try {
      const response = await axios.post(business.settings.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-BillFlow-Signature': signature,
          'X-BillFlow-Event': event,
          'User-Agent': 'BillFlow-Webhook/1.0',
        },
        timeout: 10000,
      });

      await WebhookLog.findByIdAndUpdate(log._id, {
        status: 'delivered',
        attempts: 1,
        responseStatus: response.status,
        responseBody: JSON.stringify(response.data).substring(0, 500),
      });
    } catch (webhookError: unknown) {
      const err = webhookError as { response?: { status: number; data: unknown } };
      await WebhookLog.findByIdAndUpdate(log._id, {
        status: 'failed',
        attempts: 1,
        responseStatus: err.response?.status,
        responseBody: JSON.stringify(err.response?.data || 'Request failed').substring(0, 500),
        nextRetryAt: new Date(Date.now() + 5 * 60 * 1000), // retry in 5 min
      });
      logger.warn(`Webhook delivery failed for ${event} to ${business.settings.webhookUrl}`);
    }
  } catch (error) {
    logger.error(`Dispatch webhook error: ${error}`);
  }
};

// Interswitch webhook handler
export const handleInterswitchWebhook = async (
  req: { body: Record<string, unknown>; headers: Record<string, string> },
  businessId: string
): Promise<void> => {
  const event = req.body.event as string;
  logger.info(`Received Interswitch webhook: ${event}`);

  // Map Interswitch events to our events
  const eventMap: Record<string, WebhookEvent> = {
    'charge.success': 'payment.successful',
    'charge.failed': 'payment.failed',
    'subscription.create': 'subscription.created',
    'subscription.disable': 'subscription.cancelled',
    'invoice.payment_failed': 'subscription.past_due',
  };

  const mappedEvent = eventMap[event];
  if (mappedEvent) {
    await dispatchWebhook(businessId, mappedEvent, req.body);
  }
};
