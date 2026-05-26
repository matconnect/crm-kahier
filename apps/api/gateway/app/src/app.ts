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

const normalizeOrigin = (value: string): string => {
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/$/, "");
  }
};

const allowedOrigins = new Set(origins.map(normalizeOrigin));

const crmServiceUrl = requireHttpUrl("CRM_SERVICE_URL");
const companyServiceUrl = requireHttpUrl("COMPANY_SERVICE_URL");
const kahierServiceUrl = requireHttpUrl("KAHIER_SERVICE_URL");
const billingServiceUrl = requireHttpUrl("BILLING_SERVICE_URL");

const app: express.Express = express();

const isDev = process.env.NODE_ENV !== "production";

const isPrivateIpv4 = (host: string): boolean => {
  const parts = host.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }
  const first = parts[0]!;
  const second = parts[1]!;
  if (first === 10) return true;
  if (first === 192 && second === 168) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  return false;
};

const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true;
  if (allowedOrigins.has(normalizeOrigin(origin))) return true;
  if (!isDev && allowedOrigins.size === 0) return true;
  if (!isDev) return false;
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname;
    const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (isLocalHost) return true;
    if (host.endsWith(".local")) return true;
    return isPrivateIpv4(host);
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
mountServiceProxy("/kahier-link", crmServiceUrl);
mountServiceProxy("/company", companyServiceUrl);
mountServiceProxy("/users", companyServiceUrl);
mountServiceProxy("/profile", companyServiceUrl);
mountServiceProxy("/auth", companyServiceUrl);
mountServiceProxyWithReplace("/api/company", companyServiceUrl, /^\/api\/company/);
mountServiceProxy("/kahier", kahierServiceUrl);

export default app;
