import { IRouter, Request, Response, Router } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { OpenAPIV3 } from "openapi-types";
import { API_DESCRIPTION } from "./description";
import { getRequestOrigin, resolveApiServers } from "./servers";
import { schemas } from "./components/schemas";
import { responses } from "./components/responses";
import { parameters } from "./components/parameters";
import { securitySchemes, bearerAuth } from "./components/security";
import { authPaths } from "./paths/auth";
import { profilePaths } from "./paths/profile";
import { customerPaths } from "./paths/customers";
import { productPaths } from "./paths/products";
import { paymentLinkPaths } from "./paths/payment-links";
import { paymentPaths } from "./paths/payments";
import { transactionPaths } from "./paths/transactions";
import { analyticPaths } from "./paths/analytics";
import { walletPaths } from "./paths/wallet";
import { buildSwaggerUiOptions } from "./ui";

export const DOCS_ROUTE = "/docs";
export const DOCS_SPEC_ROUTE = "/docs.json";

const tags: OpenAPIV3.TagObject[] = [
  {
    name: "Authentication",
    description: "Register a business, sign in, rotate tokens and sign out.",
  },
  {
    name: "Profile",
    description: "The signed in owner and the business they operate.",
  },
  {
    name: "Products",
    description: "The priced items a payment link can charge for.",
  },
  {
    name: "Payment links",
    description: "Shareable checkout URLs tied to a product.",
  },
  {
    name: "Checkout",
    description:
      "The public card, OTP and confirmation calls the hosted checkout makes.",
  },
  {
    name: "Customers",
    description: "People who have paid, or been added manually.",
  },
  {
    name: "Transactions",
    description: "Every charge attempt and its settlement state.",
  },
  {
    name: "Analytics",
    description: "Aggregated figures for dashboard cards and charts.",
  },
  {
    name: "Wallet",
    description: "Balances, payout requests and payout history.",
  },
];

export const createApiDocument = (
  requestOrigin?: string,
): OpenAPIV3.Document => ({
  openapi: "3.0.3",
  info: {
    title: "PayCycle API",
    version: "1.0.0",
    description: API_DESCRIPTION,
    contact: {
      name: "PayCycle",
      url: "https://pay-cycle.netlify.app",
    },
  },
  servers: resolveApiServers(requestOrigin),
  tags,
  security: bearerAuth,
  components: {
    schemas,
    responses,
    parameters,
    securitySchemes,
  },
  paths: {
    ...authPaths,
    ...profilePaths,
    ...productPaths,
    ...paymentLinkPaths,
    ...paymentPaths,
    ...customerPaths,
    ...transactionPaths,
    ...analyticPaths,
    ...walletPaths,
  },
});

const swaggerUiOptions = buildSwaggerUiOptions(DOCS_SPEC_ROUTE);

const docsSecurityHeaders = helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "http:", "https:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: null,
    },
  },
});

const docsRouter: IRouter = Router();

docsRouter.get(DOCS_SPEC_ROUTE, (req: Request, res: Response) => {
  res.json(createApiDocument(getRequestOrigin(req)));
});

docsRouter.use(
  DOCS_ROUTE,
  docsSecurityHeaders,
  swaggerUi.serveFiles(undefined, swaggerUiOptions),
  swaggerUi.setup(undefined, swaggerUiOptions),
);

export default docsRouter;
