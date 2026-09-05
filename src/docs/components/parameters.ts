import { OpenAPIV3 } from "openapi-types";

export const parameters: Record<string, OpenAPIV3.ParameterObject> = {
  Page: {
    name: "page",
    in: "query",
    required: false,
    description: "One based page number.",
    schema: { type: "integer", minimum: 1, default: 1 },
  },
  Limit: {
    name: "limit",
    in: "query",
    required: false,
    description: "Number of records per page.",
    schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
  },
  StartDate: {
    name: "startDate",
    in: "query",
    required: false,
    description: "Inclusive lower bound on the creation date.",
    schema: { type: "string", format: "date-time" },
  },
  EndDate: {
    name: "endDate",
    in: "query",
    required: false,
    description: "Inclusive upper bound on the creation date.",
    schema: { type: "string", format: "date-time" },
  },
  IsActive: {
    name: "isActive",
    in: "query",
    required: false,
    description: "Filter by active state. Omit to return both states.",
    schema: { type: "boolean" },
  },
};

export const pathParameter = (
  name: string,
  description: string,
): OpenAPIV3.ParameterObject => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { $ref: "#/components/schemas/ObjectId" },
});
