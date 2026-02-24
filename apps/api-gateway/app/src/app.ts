import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";

const splitUrls = (csv?: string) =>
  (csv ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
    .map((u) => u.replace(/\/$/, ""));

const urlDev = splitUrls(process.env.URL_DEV);
const urlProd = splitUrls(process.env.URL_PROD);
const origins = process.env.NODE_ENV === "production" ? urlProd : urlDev;

const crmServiceUrl = process.env.CRM_SERVICE_URL ?? "http://crm-service:3021";
const companyServiceUrl = process.env.COMPANY_SERVICE_URL ?? "http://company-service:3022";
const kahierServiceUrl = process.env.KAHIER_SERVICE_URL ?? "http://kahier-service:3023";

const app: express.Express = express();

const isDev = process.env.NODE_ENV !== "production";

const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true;
  if (origins.includes(origin)) return true;
  if (!isDev) return false;
  try {
    const parsed = new URL(origin);
    const isLocalHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    return isLocalHost;
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
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

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "api-gateway",
    upstreams: {
      crmServiceUrl,
      companyServiceUrl,
      kahierServiceUrl,
    },
  });
});

mountServiceProxy("/clients", crmServiceUrl);
mountServiceProxy("/company", companyServiceUrl);
mountServiceProxy("/users", companyServiceUrl);
mountServiceProxy("/profile", companyServiceUrl);
mountServiceProxy("/kahier", kahierServiceUrl);

export default app;
