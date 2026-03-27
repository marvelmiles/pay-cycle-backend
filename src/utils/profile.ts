import Business, { IBusinessDoc } from "../models/business";
import { IUserDoc } from "../models/profiles/user";

export const getBusinessId = async (userId?: string, toString = false) => {
  if (!userId) return "";

  const biz = await Business.findOne({ owner: userId });
  return toString ? biz?._id?.toString() : biz?._id;
};

export const getBusinessPublicData = (
  business: IBusinessDoc | null,
  withSensitive = false,
) => {
  if (!business) return null;

  const data: {
    id: string;
    name: IBusinessDoc["name"];
    slug: IBusinessDoc["slug"];
    image?: IBusinessDoc["image"];
    availableBalance?: IBusinessDoc["availableBalance"];
    bank?: IBusinessDoc["bank"];
  } = {
    id: business._id.toString(),
    name: business.name,
    slug: business.slug,
    image: business.image,
  };

  if (withSensitive) {
    data.availableBalance = business.availableBalance;
    data.bank = business.bank;
  }

  return data;
};

export const getUserPublicData = (user: IUserDoc | null) => {
  if (!user) return null;

  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    image: user.image,
  };
};
