import { OpenAPIV3 } from "openapi-types";
import { bearerAuth } from "../components/security";
import { dataResponse } from "../components/responses";

export const analyticPaths: OpenAPIV3.PathsObject = {
  "/analytics/dashboard": {
    get: {
      tags: ["Analytics"],
      summary: "Get dashboard statistics",
      description:
        "Everything the dashboard summary cards need in one call: lifetime and current month revenue, month over month growth, customer counts, failed payment counts, the payment success rate and the five most recent transactions. Months are calendar months in server time.",
      security: bearerAuth,
      responses: {
        "200": dataResponse("The dashboard statistics.", {
          $ref: "#/components/schemas/DashboardStats",
        }),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/analytics/revenue": {
    get: {
      tags: ["Analytics"],
      summary: "Get the revenue time series",
      description:
        "Successful transactions bucketed for charting. Buckets with no revenue are omitted, so pad the series on the client when you need a continuous axis.",
      security: bearerAuth,
      parameters: [
        {
          name: "period",
          in: "query",
          required: false,
          description: "Bucket size for the series.",
          schema: {
            type: "string",
            enum: ["monthly", "daily"],
            default: "monthly",
          },
        },
        {
          name: "months",
          in: "query",
          required: false,
          description: "How far back the window reaches, in months.",
          schema: { type: "integer", minimum: 1, maximum: 24, default: 6 },
        },
      ],
      responses: {
        "200": dataResponse("The revenue series, oldest bucket first.", {
          type: "array",
          items: { $ref: "#/components/schemas/RevenuePoint" },
        }),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },
};
