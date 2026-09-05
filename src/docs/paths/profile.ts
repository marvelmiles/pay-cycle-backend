import { OpenAPIV3 } from "openapi-types";
import { bearerAuth } from "../components/security";
import { dataResponse } from "../components/responses";
import { pathParameter } from "../components/parameters";

const imageField: OpenAPIV3.SchemaObject = {
  type: "string",
  format: "binary",
  description:
    "Image file up to 5MB. Uploaded to Cloudinary and stored as a URL.",
};

export const profilePaths: OpenAPIV3.PathsObject = {
  "/profile/me": {
    get: {
      tags: ["Profile"],
      summary: "Get the signed in owner and business",
      description:
        "The single call a dashboard shell needs on boot. Returns the owner profile plus the business summary including available balance and payout account.",
      security: bearerAuth,
      responses: {
        "200": dataResponse("The owner profile and business summary.", {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            business: { $ref: "#/components/schemas/BusinessSummary" },
          },
        }),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
    put: {
      tags: ["Profile"],
      summary: "Update the owner profile",
      description:
        "Send as multipart form data. Omitted fields keep their current value, so partial updates are safe.",
      security: bearerAuth,
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                firstName: { type: "string", example: "Amara" },
                lastName: { type: "string", example: "Okonkwo" },
                image: imageField,
              },
            },
          },
        },
      },
      responses: {
        "200": dataResponse(
          "The updated owner document.",
          { $ref: "#/components/schemas/User" },
          true,
        ),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },

  "/profile/business/{id}": {
    put: {
      tags: ["Profile"],
      summary: "Update the business profile",
      description:
        "Send as multipart form data. Use bracket notation for the payout account fields, for example bank[accountNumber]. Omitted fields keep their current value.",
      security: bearerAuth,
      parameters: [pathParameter("id", "Business id.")],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string", example: "Lagos Coffee Roasters" },
                slug: { type: "string", example: "lagos-coffee-roasters" },
                "bank[name]": { type: "string", example: "Guaranty Trust Bank" },
                "bank[accountNumber]": { type: "string", example: "0123456789" },
                "bank[accountName]": {
                  type: "string",
                  example: "Lagos Coffee Roasters",
                },
                image: imageField,
              },
            },
          },
        },
      },
      responses: {
        "200": dataResponse(
          "The updated business document.",
          { $ref: "#/components/schemas/Business" },
          true,
        ),
        "401": { $ref: "#/components/responses/Unauthorized" },
        "404": { $ref: "#/components/responses/NotFound" },
        "500": { $ref: "#/components/responses/ServerError" },
      },
    },
  },
};
