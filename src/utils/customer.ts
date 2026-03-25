import { Business } from "../models/core.models";

export const getBusinessId = async (userId: string) => {
  const biz = await Business.findOne({ owner: userId });
  return biz?._id?.toString();
};
