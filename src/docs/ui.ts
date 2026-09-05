import { SwaggerUiOptions } from "swagger-ui-express";
import { BEARER_SECURITY_SCHEME } from "./components/security";

export interface SwaggerUiSetupOptions extends SwaggerUiOptions {
  customJsStr?: string | string[];
}

const AUTO_AUTHORIZE_SCRIPT = `
(function () {
  var TOKEN_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/refresh"];
  var SECURITY_SCHEME = "${BEARER_SECURITY_SCHEME}";
  var originalFetch = window.fetch.bind(window);

  var applyToken = function (token) {
    if (!token || !window.ui) return;

    window.ui.authActions.authorize({
      [SECURITY_SCHEME]: {
        name: SECURITY_SCHEME,
        schema: { type: "http", scheme: "bearer" },
        value: token
      }
    });
  };

  var readAccessToken = function (response) {
    return response
      .clone()
      .json()
      .then(function (body) {
        return body && body.data && body.data.accessToken;
      })
      .catch(function () {
        return null;
      });
  };

  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";

    return originalFetch(input, init).then(function (response) {
      var isTokenEndpoint = TOKEN_ENDPOINTS.some(function (endpoint) {
        return url.indexOf(endpoint) !== -1;
      });

      if (!isTokenEndpoint || !response.ok) return response;

      return readAccessToken(response).then(function (token) {
        applyToken(token);
        return response;
      });
    });
  };
})();
`;

const CUSTOM_STYLES = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info { margin: 32px 0; }
  .swagger-ui .info .title small.version-stamp { background-color: #2563eb; }
  .swagger-ui .scheme-container {
    box-shadow: none;
    border-bottom: 1px solid #e5e7eb;
  }
  .swagger-ui .btn.authorize { border-color: #2563eb; color: #2563eb; }
  .swagger-ui .btn.authorize svg { fill: #2563eb; }
`;

export const buildSwaggerUiOptions = (
  specUrl: string,
): SwaggerUiSetupOptions => ({
  swaggerUrl: specUrl,
  customSiteTitle: "PayCycle API Reference",
  customCss: CUSTOM_STYLES,
  customJsStr: AUTO_AUTHORIZE_SCRIPT,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: "none",
    filter: true,
    tryItOutEnabled: true,
    defaultModelsExpandDepth: 1,
    defaultModelRendering: "example",
    tagsSorter: "alpha",
  },
});
