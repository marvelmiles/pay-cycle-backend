import { OpenAPIV3 } from "openapi-types";
import { bearerAuth } from "../components/security";
import {
  dataResponse,
  messageResponse,
  paginatedResponse,
} from "../components/responses";
import { pathParameter } from "../components/parameters";

export const paymentLinkPaths: OpenAPIV3.PathsObject = {
  "/payment-links": {
    get: {
      tags: ["Payment links"],
      summary: "List payment links",
      security: bearerAuth,
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        { $ref: "#/components/parameters/IsActive" },
      ],
      responses: {
        "200": paginatedResponse(
          "A page of payment links with their product populated.",
          "PaymentLink",
        ),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
    post: {
      tags: ["Payment links"],
      summary: "Create a payment link",
      description:
        "The amount and currency are copied from the selected product, so a link always charges the product price. The response carries a ready to share paymentUrl built from the app base URL and the generated slug.",
      security: bearerAuth,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PaymentLinkInput" },
          },
        },
      },
      responses: {
        "201": dataResponse(
          "The created payment link plus its shareable URL.",
          {
            allOf: [
              { $ref: "#/components/schemas/PaymentLink" },
              {
                type: "object",
                properties: {
                  paymentUrl: {
                    type: "string",
                    format: "uri",
                    example:
                      "https://pay-cycle.netlify.app/pay/buy-250g-ethiopian-yirgacheffe-a1b2c3",
                  },
                },
              },
            ],
          },
          true,
        ),
        "400": { $ref: "#/components/responses/BadRequest" },
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/payment-links/{id}": {
    get: {
      tags: ["Payment links"],
      summary: "Get a payment link",
      description:
        "Public endpoint. No access token is required because the hosted checkout page reads it before the payer has an account. The product and the owning business are populated so the checkout can render branding, price and features.",
      security: [],
      parameters: [pathParameter("id", "Payment link id.")],
      responses: {
        "200": dataResponse("The payment link.", {
          $ref: "#/components/schemas/PaymentLink",
        }),
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
    put: {
      tags: ["Payment links"],
      summary: "Update a payment link",
      description:
        "Amount, currency and isFixedAmount are ignored on purpose. Change the underlying product price or create a new link instead.",
      security: bearerAuth,
      parameters: [pathParameter("id", "Payment link id.")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                redirectUrl: { type: "string", format: "uri" },
                maxUses: { type: "integer", minimum: 1 },
                expiresAt: { type: "string", format: "date-time" },
                isActive: { type: "boolean" },
              },
            },
          },
        },
      },
      responses: {
        "200": dataResponse(
          "The updated payment link.",
          { $ref: "#/components/schemas/PaymentLink" },
          true,
        ),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
    delete: {
      tags: ["Payment links"],
      summary: "Deactivate a payment link",
      description:
        "A soft delete. The link stops accepting payments but stays visible in the dashboard.",
      security: bearerAuth,
      parameters: [pathParameter("id", "Payment link id.")],
      responses: {
        "200": messageResponse(
          "The payment link was deactivated.",
          "Payment link deactivated",
        ),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },
};
