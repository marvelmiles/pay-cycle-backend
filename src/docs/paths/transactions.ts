import { OpenAPIV3 } from "openapi-types";
import { bearerAuth } from "../components/security";
import { dataResponse, paginatedResponse } from "../components/responses";
import { pathParameter } from "../components/parameters";

export const transactionPaths: OpenAPIV3.PathsObject = {
  "/transactions": {
    get: {
      tags: ["Transactions"],
      summary: "List transactions",
      description:
        "Newest first, with the customer and product summaries populated so a table can render without follow up requests.",
      security: bearerAuth,
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
        {
          name: "status",
          in: "query",
          required: false,
          description: "Filter by settlement state.",
          schema: {
            type: "string",
            enum: ["pending", "successful", "failed"],
          },
        },
        {
          name: "type",
          in: "query",
          required: false,
          description: "Filter by billing model.",
          schema: { type: "string", enum: ["one_time", "recurring"] },
        },
        { $ref: "#/components/parameters/StartDate" },
        { $ref: "#/components/parameters/EndDate" },
      ],
      responses: {
        "200": paginatedResponse("A page of transactions.", "Transaction"),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/transactions/{id}": {
    get: {
      tags: ["Transactions"],
      summary: "Get a transaction",
      description:
        "Returns the transaction with the full customer and product documents populated.",
      security: bearerAuth,
      parameters: [pathParameter("id", "Transaction id.")],
      responses: {
        "200": dataResponse("The transaction.", {
          $ref: "#/components/schemas/Transaction",
        }),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },
};
