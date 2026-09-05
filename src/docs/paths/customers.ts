import { OpenAPIV3 } from "openapi-types";
import { bearerAuth } from "../components/security";
import { dataResponse, paginatedResponse } from "../components/responses";
import { pathParameter } from "../components/parameters";

export const customerPaths: OpenAPIV3.PathsObject = {
  "/customers": {
    get: {
      tags: ["Customers"],
      summary: "List customers",
      description:
        "Customers are created automatically the first time someone pays one of your links, and can also be added manually.",
      security: bearerAuth,
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        {
          name: "search",
          in: "query",
          required: false,
          description:
            "Case insensitive partial match against email, first name and last name.",
          schema: { type: "string" },
          example: "ada",
        },
      ],
      responses: {
        "200": paginatedResponse("A page of customers.", "Customer"),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
    post: {
      tags: ["Customers"],
      summary: "Create a customer",
      description:
        "Email is unique per business, so a duplicate returns 409 rather than creating a second record.",
      security: bearerAuth,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CustomerInput" },
          },
        },
      },
      responses: {
        "201": dataResponse(
          "The created customer.",
          { $ref: "#/components/schemas/Customer" },
          true,
        ),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "409": { $ref: "#/components/responses/Conflict" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/customers/{id}": {
    get: {
      tags: ["Customers"],
      summary: "Get a customer with recent transactions",
      description:
        "Returns the customer record plus their ten most recent transactions, enough to render a customer detail page in one request.",
      security: bearerAuth,
      parameters: [pathParameter("id", "Customer id.")],
      responses: {
        "200": dataResponse("The customer and their recent activity.", {
          type: "object",
          properties: {
            customer: { $ref: "#/components/schemas/Customer" },
            transactions: {
              type: "array",
              items: { $ref: "#/components/schemas/Transaction" },
            },
          },
        }),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
    put: {
      tags: ["Customers"],
      summary: "Update a customer",
      security: bearerAuth,
      parameters: [pathParameter("id", "Customer id.")],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CustomerInput" },
          },
        },
      },
      responses: {
        "200": dataResponse(
          "The updated customer.",
          { $ref: "#/components/schemas/Customer" },
          true,
        ),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },
};
