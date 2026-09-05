import { OpenAPIV3 } from "openapi-types";
import { bearerAuth } from "../components/security";
import {
  dataResponse,
  messageResponse,
  paginatedResponse,
} from "../components/responses";
import { pathParameter } from "../components/parameters";

export const productPaths: OpenAPIV3.PathsObject = {
  "/products": {
    get: {
      tags: ["Products"],
      summary: "List products",
      description:
        "Products are scoped to the business owned by the signed in user. Results are newest first.",
      security: bearerAuth,
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        {
          name: "type",
          in: "query",
          required: false,
          description: "Filter by billing model.",
          schema: { type: "string", enum: ["one_time", "recurring"] },
        },
        { $ref: "#/components/parameters/IsActive" },
      ],
      responses: {
        "200": paginatedResponse("A page of products.", "Product"),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
    post: {
      tags: ["Products"],
      summary: "Create a product",
      description:
        "A product holds the price a payment link charges. Create one before creating a payment link.",
      security: bearerAuth,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ProductInput" },
            examples: {
              "One time product": {
                value: {
                  name: "250g Ethiopian Yirgacheffe",
                  description: "Roasted to order and shipped within 48 hours.",
                  type: "one_time",
                  price: 25000,
                  features: ["250g roasted beans", "Free Lagos delivery"],
                },
              },
              "Recurring product": {
                value: {
                  name: "Monthly Coffee Club",
                  description: "A fresh bag delivered every month.",
                  type: "recurring",
                  price: 22000,
                  interval: "monthly",
                  intervalCount: 1,
                  trialDays: 7,
                  features: ["Priority roasting", "Cancel anytime"],
                },
              },
            },
          },
        },
      },
      responses: {
        "201": dataResponse(
          "The created product.",
          { $ref: "#/components/schemas/Product" },
          true,
        ),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/products/{id}": {
    get: {
      tags: ["Products"],
      summary: "Get a product",
      security: bearerAuth,
      parameters: [pathParameter("id", "Product id.")],
      responses: {
        "200": dataResponse("The product.", {
          $ref: "#/components/schemas/Product",
        }),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
    put: {
      tags: ["Products"],
      summary: "Update a product",
      description:
        "Accepts any subset of the create payload. Existing payment links keep the price they were created with.",
      security: bearerAuth,
      parameters: [pathParameter("id", "Product id.")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ProductInput" },
          },
        },
      },
      responses: {
        "200": dataResponse(
          "The updated product.",
          { $ref: "#/components/schemas/Product" },
          true,
        ),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
    delete: {
      tags: ["Products"],
      summary: "Deactivate a product",
      description:
        "A soft delete. The product is flagged inactive and kept so historic transactions stay readable.",
      security: bearerAuth,
      parameters: [pathParameter("id", "Product id.")],
      responses: {
        "200": messageResponse(
          "The product was deactivated.",
          "Product deactivated",
        ),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },
};
