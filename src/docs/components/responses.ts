import { OpenAPIV3 } from "openapi-types";

const errorResponse = (
  description: string,
  message: string,
): OpenAPIV3.ResponseObject => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorResponse" },
      example: { success: false, message },
    },
  },
});

export const responses: Record<string, OpenAPIV3.ResponseObject> = {
  BadRequest: errorResponse(
    "The request payload failed validation.",
    "A product must be selected to create a payment link",
  ),
  Unauthorized: errorResponse(
    "The access token is missing, expired or belongs to an inactive user.",
    "Invalid or expired token",
  ),
  Forbidden: errorResponse(
    "The account exists but is deactivated.",
    "Account has been deactivated",
  ),
  NotFound: errorResponse(
    "The requested resource does not exist or does not belong to the authenticated business.",
    "Resource not found",
  ),
  Conflict: errorResponse(
    "The resource already exists.",
    "Email already registered",
  ),
  TooManyRequests: errorResponse(
    "The rate limit for this route was exceeded.",
    "Too many requests, please try again later.",
  ),
  ServerError: errorResponse(
    "An unexpected error occurred, or an upstream gateway call failed.",
    "Internal Server Error",
  ),
};

export const paginatedResponse = (
  description: string,
  itemSchema: string,
): OpenAPIV3.ResponseObject => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: { $ref: `#/components/schemas/${itemSchema}` },
          },
          pagination: { $ref: "#/components/schemas/Pagination" },
        },
      },
    },
  },
});

export const dataResponse = (
  description: string,
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject,
  withMessage = false,
): OpenAPIV3.ResponseObject => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          ...(withMessage ? { message: { type: "string" } } : {}),
          data: schema,
        },
      },
    },
  },
});

export const messageResponse = (
  description: string,
  message: string,
): OpenAPIV3.ResponseObject => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/MessageResponse" },
      example: { success: true, message },
    },
  },
});

export const commonErrors: OpenAPIV3.ResponsesObject = {
  "401": { $ref: "#/components/responses/Unauthorized" },
  "500": { $ref: "#/components/responses/ServerError" },
};
