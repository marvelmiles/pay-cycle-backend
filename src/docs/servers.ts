import { Request } from "express";
import { OpenAPIV3 } from "openapi-types";

export const API_PREFIX = "/api/v1";

const LOCAL_HOST_PATTERN =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?$/i;

const stripApiPrefix = (origin: string): string =>
  origin
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v\d+$/i, "");

const isLocalOrigin = (origin: string): boolean => {
  try {
    return LOCAL_HOST_PATTERN.test(new URL(origin).host);
  } catch {
    return false;
  }
};

const toServer = (
  origin: string,
  description: string,
): OpenAPIV3.ServerObject => ({
  url: `${origin}${API_PREFIX}`,
  description,
});

export const getRequestOrigin = (req: Request): string =>
  `${req.protocol}://${req.get("host")}`;

export const getLocalOrigin = (): string =>
  `http://localhost:${process.env.PORT || 5000}`;

export const getProductionOrigin = (): string | null => {
  const configured = process.env.API_URL;

  if (!configured) return null;

  const origin = stripApiPrefix(configured);

  return isLocalOrigin(origin) ? null : origin;
};

export const resolveApiServers = (
  requestOrigin?: string,
): OpenAPIV3.ServerObject[] => {
  const localOrigin = getLocalOrigin();
  const productionOrigin = getProductionOrigin();
  const currentOrigin = requestOrigin ? stripApiPrefix(requestOrigin) : null;

  const servers = new Map<string, OpenAPIV3.ServerObject>();

  servers.set(localOrigin, toServer(localOrigin, "Local development"));

  if (productionOrigin) {
    servers.set(productionOrigin, toServer(productionOrigin, "Production"));
  }

  if (currentOrigin && !servers.has(currentOrigin)) {
    servers.set(currentOrigin, toServer(currentOrigin, "Current deployment"));
  }

  const servesFromLocalhost = !currentOrigin || isLocalOrigin(currentOrigin);
  const defaultOrigin = servesFromLocalhost ? localOrigin : currentOrigin;

  const defaultServer = servers.get(defaultOrigin);
  const remaining = [...servers.entries()]
    .filter(([origin]) => origin !== defaultOrigin)
    .map(([, server]) => server);

  return defaultServer ? [defaultServer, ...remaining] : remaining;
};
