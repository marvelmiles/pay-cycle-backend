import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export const generateReference = (prefix = 'TXN'): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const generateApiToken = (): string => {
  return `sk_${uuidv4().replace(/-/g, '')}`;
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const encryptData = (data: string): string => {
  const key = process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!!';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.substring(0, 32)), iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

export const decryptData = (encryptedData: string): string => {
  const key = process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!!';
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.substring(0, 32)), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const generateWebhookSignature = (payload: string, secret: string): string => {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

export const verifyWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
  const expected = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

export const formatAmount = (amount: number, currency = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
  }).format(amount / 100);
};

export const paginate = (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  return { skip, limit };
};
