import { Response } from "express";
import logger from "./logger";

export const serializeSuccessResponse = (data: any) => {
  return {
    data,
    success: true,
  };
};

export const getErrorDetails = (error: any, stringify = true) => {
  const err = {
    data: error.response?.data,
    status: error.response?.status,
    message: error.response?.data?.message || error.message,
    statusCode: error.status || error.statusCode,
  };

  return stringify ? JSON.stringify(err) : err;
};

// could be a regular error or axios error
export const serializeErrorResponse = (error: any) => {
  if (error.success === false && typeof error.status === "number") return error;

  const message = error.response?.data?.message || "Something went wrong.";

  const status = error.response?.status || error.status || 500;

  return {
    success: false,
    message,
    status,
    errors: error.response?.data?.errors || [],
  };
};

export const createErrorResponse = (
  res: Response,
  error: any,
  config?: { withLogger?: boolean; logMsg?: string },
) => {
  const { withLogger = true, logMsg = "Error response" } = config || {};

  const err = serializeErrorResponse(error);

  if (withLogger) logger.error(`${logMsg}: ${getErrorDetails(error)}`);

  res.status(err.status).json(err);
};
