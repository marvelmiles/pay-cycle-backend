import { Business } from "../models/core.models";

export const getBusinessId = async (userId: string, toString = false) => {
  const biz = await Business.findOne({ owner: userId });
  return toString ? biz?._id?.toString() : biz?._id;
};
