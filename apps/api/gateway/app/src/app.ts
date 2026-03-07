import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import { readFileSync } from "node:fs";

const readSecret = (path: string): string => readFileSync(path, "utf8").trim();

const fromEnvOrFile = (name: string): string | undefined => {
  const direct = process.env[name];
  if (direct && direct.trim()) return direct.trim();

  const filePath = process.env[`${name}_FILE`];
  if (filePath && filePath.trim()) return readSecret(filePath.trim());

  return undefined;
};

const requireEnvOrFile = (name: string): string => {
  const value = fromEnvOrFile(name);
  if (!value) throw new Error(`Missing required env: ${name} or ${name}_FILE`);
  return value;
};

const requireHttpUrl = (name: string): string => {
  const value = requireEnvOrFile(name);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid URL for ${name}: "${value}"`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Invalid URL protocol for ${name}: "${parsed.protocol}"`);
  }
  return parsed.toString().replace(/\/$/, "");
};

const splitUrls = (csv?: string) =>
  (csv ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
    .map((u) => u.replace(/\/$/, ""));

const urlDev = splitUrls(process.env.URL_DEV);
const urlProd = splitUrls(process.env.URL_PROD);
const origins = process.env.NODE_ENV === "production" ? urlProd : urlDev;

const crmServiceUrl = requireHttpUrl("CRM_SERVICE_URL");
const companyServiceUrl = requireHttpUrl("COMPANY_SERVICE_URL");
const kahierServiceUrl = requireHttpUrl("KAHIER_SERVICE_URL");

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
mountServiceProxy("/auth", companyServiceUrl);
mountServiceProxy("/kahier", kahierServiceUrl);

export default app;
