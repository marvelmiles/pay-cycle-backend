export const encodeBase64 = (value: string): string => {
  return Buffer.from(value, "utf-8").toString("base64");
};
