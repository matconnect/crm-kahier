import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import { isAllowedOrigin, normalizeOrigin, requireHttpUrl, splitUrls } from "./lib/config.js";

const urlDev = splitUrls(process.env.URL_DEV);
const urlProd = splitUrls(process.env.URL_PROD);
const origins = process.env.NODE_ENV === "production" ? urlProd : urlDev;

const allowedOrigins = new Set(origins.map(normalizeOrigin));

const crmServiceUrl = requireHttpUrl("CRM_SERVICE_URL");
const companyServiceUrl = requireHttpUrl("COMPANY_SERVICE_URL");
const kahierServiceUrl = requireHttpUrl("KAHIER_SERVICE_URL");
const billingServiceUrl = requireHttpUrl("BILLING_SERVICE_URL");

const app: express.Express = express();

const isDev = process.env.NODE_ENV !== "production";

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin, allowedOrigins, isDev)) return callback(null, true);
      return callback(new Error("CORS origin rejected"));
    },
    credentials: true,
  }),
);

function mountServiceProxy(basePath: string, target: string) {
  app.use(
    basePath,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      xfwd: true,
      ws: true,
      pathRewrite: (path) => `${basePath}${path}`,
    }),
  );
}

function mountServiceProxyWithReplace(basePath: string, target: string, replacePrefix: string | RegExp) {
  app.use(
    basePath,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      xfwd: true,
      ws: true,
      pathRewrite: (path) => path.replace(replacePrefix, "") || "/",
    }),
  );
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "api-gateway",
    upstreams: {
      crmServiceUrl,
      companyServiceUrl,
      kahierServiceUrl,
      billingServiceUrl,
    },
  });
});

mountServiceProxy("/billing", billingServiceUrl);
app.use(
  "/auth/stripe/webhook",
  createProxyMiddleware({
    target: billingServiceUrl,
    changeOrigin: true,
    xfwd: true,
    ws: true,
    pathRewrite: () => "/billing/stripe/webhook",
  }),
);
mountServiceProxy("/clients", crmServiceUrl);
mountServiceProxy("/projects", crmServiceUrl);
mountServiceProxy("/invoices", crmServiceUrl);
mountServiceProxy("/quotes", crmServiceUrl);
mountServiceProxy("/kahier-link", crmServiceUrl);
mountServiceProxy("/company", companyServiceUrl);
mountServiceProxy("/users", companyServiceUrl);
mountServiceProxy("/profile", companyServiceUrl);
mountServiceProxy("/auth", companyServiceUrl);
mountServiceProxyWithReplace("/api/company", companyServiceUrl, /^\/api\/company/);
mountServiceProxy("/kahier", kahierServiceUrl);

export default app;
