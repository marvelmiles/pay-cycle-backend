import { OpenAPIV3 } from "openapi-types";

export const BEARER_SECURITY_SCHEME = "bearerAuth";

export const securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject> = {
  [BEARER_SECURITY_SCHEME]: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "Access token returned by POST /auth/login or POST /auth/register. Signing in from this page authorises every protected endpoint automatically.",
  },
};

export const bearerAuth: OpenAPIV3.SecurityRequirementObject[] = [
  { [BEARER_SECURITY_SCHEME]: [] },
];
