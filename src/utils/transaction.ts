import { v4 as uuidv4 } from "uuid";

export function generateTransactionRef(length: number = 12): string {
  const finalLength = Math.min(Math.max(length, 6), 40);

  const uuid = uuidv4().replace(/-/g, "");

  const uniqueString = uuid.substring(0, finalLength);

  return `TRX-${uniqueString.toUpperCase()}`;
}
