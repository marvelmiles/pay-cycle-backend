import { OpenAPIV3 } from "openapi-types";
import {
  TEST_ACCOUNTS,
  TEST_ACCOUNT_PASSWORD,
} from "../../constants/test-accounts";
import { bearerAuth } from "../components/security";
import { dataResponse, messageResponse } from "../components/responses";

const buildTestAccountExamples = (): Record<
  string,
  OpenAPIV3.ExampleObject
> => {
  const examples: Record<string, OpenAPIV3.ExampleObject> = {};

  TEST_ACCOUNTS.forEach((account) => {
    examples[account.businessName] = {
      summary: `${account.label} (${account.email})`,
      description: account.description,
      value: { email: account.email, password: TEST_ACCOUNT_PASSWORD },
    };
  });

  return examples;
};

export const authPaths: OpenAPIV3.PathsObject = {
  "/auth/register": {
    post: {
      tags: ["Authentication"],
      summary: "Register a business owner",
      description:
        "Creates the user account and its business in one call, then returns a ready to use session. The business slug is derived from the business name and made unique automatically.",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password", "firstName", "lastName"],
              properties: {
                firstName: { type: "string", example: "Amara" },
                lastName: { type: "string", example: "Okonkwo" },
                email: {
                  type: "string",
                  format: "email",
                  example: "amara@lagoscoffee.test",
                },
                password: {
                  type: "string",
                  minLength: 8,
                  format: "password",
                  example: "PayCycle@2025",
                },
                businessName: {
                  type: "string",
                  description:
                    "Optional. Defaults to the first name of the owner when omitted.",
                  example: "Lagos Coffee Roasters",
                },
              },
            },
          },
        },
      },
      responses: {
        "201": dataResponse(
          "The account, its business and a signed in session.",
          { $ref: "#/components/schemas/AuthSession" },
          true,
        ),
        "409": { $ref: "#/components/responses/Conflict" },
        "429": { $ref: "#/components/responses/TooManyRequests" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/auth/login": {
    post: {
      tags: ["Authentication"],
      summary: "Sign in",
      description:
        "Returns the owner profile, the business summary and a token pair. Pick one of the seeded test accounts from the Examples dropdown below to sign in instantly.",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: TEST_ACCOUNTS[0].email,
                },
                password: {
                  type: "string",
                  format: "password",
                  example: TEST_ACCOUNT_PASSWORD,
                },
              },
            },
            examples: buildTestAccountExamples(),
          },
        },
      },
      responses: {
        "200": dataResponse(
          "Signed in successfully.",
          { $ref: "#/components/schemas/AuthSession" },
          true,
        ),
        "401": {
          $ref: "#/components/responses/Unauthorized",
        },
        "403": { $ref: "#/components/responses/Forbidden" },
        "429": { $ref: "#/components/responses/TooManyRequests" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/auth/refresh": {
    post: {
      tags: ["Authentication"],
      summary: "Rotate the token pair",
      description:
        "Exchanges a valid refresh token for a new access and refresh token. The previous refresh token is invalidated, so store the new one.",
      security: [],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["refreshToken"],
              properties: {
                refreshToken: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "200": dataResponse("A fresh token pair.", {
          type: "object",
          properties: {
            accessToken: { type: "string" },
            refreshToken: { type: "string" },
          },
        }),
        "401": { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },

  "/auth/logout": {
    post: {
      tags: ["Authentication"],
      summary: "Sign out",
      description:
        "Clears the stored refresh token so it can no longer be redeemed. The access token stays valid until it expires, so clear it on the client too.",
      security: bearerAuth,
      responses: {
        "200": messageResponse(
          "Signed out successfully.",
          "Logged out successfully",
        ),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },
};
