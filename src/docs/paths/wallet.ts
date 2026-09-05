import { OpenAPIV3 } from "openapi-types";
import { bearerAuth } from "../components/security";
import { dataResponse, paginatedResponse } from "../components/responses";
import { pathParameter } from "../components/parameters";

const businessIdParameter = pathParameter(
  "businessId",
  "Business id, taken from the business summary returned at sign in.",
);

export const walletPaths: OpenAPIV3.PathsObject = {
  "/wallet/{businessId}": {
    get: {
      tags: ["Wallet"],
      summary: "Get the wallet summary",
      description:
        "Aggregated payout figures for the business. The spendable balance itself lives on the business summary as availableBalance, returned at sign in and from GET /profile/me.",
      security: bearerAuth,
      parameters: [businessIdParameter],
      responses: {
        "200": dataResponse("The wallet summary.", {
          $ref: "#/components/schemas/WalletSummary",
        }),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/wallet/withdrawals/{businessId}": {
    get: {
      tags: ["Wallet"],
      summary: "List withdrawal requests",
      description: "Newest first, with the owning business populated.",
      security: bearerAuth,
      parameters: [
        businessIdParameter,
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        {
          name: "status",
          in: "query",
          required: false,
          description: "Filter by payout state.",
          schema: {
            type: "string",
            enum: [
              "pending",
              "successful",
              "failed",
              "refunded",
              "rejected",
              "cancelled",
            ],
          },
        },
        { $ref: "#/components/parameters/StartDate" },
        { $ref: "#/components/parameters/EndDate" },
      ],
      responses: {
        "200": paginatedResponse(
          "A page of withdrawal requests.",
          "Withdrawal",
        ),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/wallet/withdraw/{businessId}": {
    post: {
      tags: ["Wallet"],
      summary: "Request a withdrawal",
      description:
        "Creates a pending payout request and debits the available balance of the business immediately, so the returned business summary is what the wallet screen should render next. The balance floors at zero rather than going negative.",
      security: bearerAuth,
      parameters: [businessIdParameter],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["amount"],
              properties: {
                amount: { type: "number", minimum: 1, example: 150000 },
                note: { type: "string", example: "August payout" },
              },
            },
          },
        },
      },
      responses: {
        "200": dataResponse(
          "The pending request and the updated business summary.",
          {
            type: "object",
            properties: {
              withdraw: { $ref: "#/components/schemas/Withdrawal" },
              business: { $ref: "#/components/schemas/BusinessSummary" },
            },
          },
          true,
        ),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/wallet/withdraw/{id}/{businessId}/cancel": {
    post: {
      tags: ["Wallet"],
      summary: "Cancel a withdrawal request",
      description:
        "Marks the request cancelled and returns the debited amount to the available balance. Note that this response carries the full business document under `business` and has no `success` flag.",
      security: bearerAuth,
      parameters: [
        pathParameter("id", "Withdrawal request id."),
        businessIdParameter,
      ],
      responses: {
        "200": {
          description: "The request was cancelled and the balance restored.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  business: { $ref: "#/components/schemas/Business" },
                  message: {
                    type: "string",
                    example: "Withdrawal request cancelled",
                  },
                },
              },
            },
          },
        },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },
};
