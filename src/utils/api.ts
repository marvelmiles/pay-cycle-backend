import { Response } from "express";

export const serializeSuccessResponse = (data: any) => {
  return {
    data,
    success: true,
  };
};

// could be a regular error or axios error
export const serializeErrorResponse = (error: any) => {
  const message = error.response?.data?.message || "Something went wrong.";

  const code = error.response?.status || error.status || 500;

  return {
    success: false,
    message,
    code,
    errors: error.response?.data?.errors || [],
  };
};

export const createErrorResponse = (res: Response, error: any) => {
  const err = serializeErrorResponse(error);

  res.status(err.code).json(err);
};
