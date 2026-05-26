import { readFileSync } from "node:fs";

export function getEnvOrFile(name: string): string | null {
  const direct = process.env[name]?.trim();
  if (direct) return direct;

  const filePath = process.env[`${name}_FILE`]?.trim();
  if (!filePath) return null;

  try {
    const value = readFileSync(filePath, "utf8").trim();
    return value || null;
  } catch {
    return null;
  }
}

export function resolvePublicAppUrl() {
  const explicit = getEnvOrFile("APP_PUBLIC_URL");
  if (explicit) return explicit.replace(/\/$/, "");

  const urlProd = process.env.URL_PROD?.split(",")[0]?.trim();
  if (urlProd) return urlProd.replace(/\/$/, "");

  const urlDev = process.env.URL_DEV?.split(",")[0]?.trim();
  if (urlDev) return urlDev.replace(/\/$/, "");

  return null;
}

export function splitUrls(csv?: string) {
  return (csv ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => url.replace(/\/$/, ""));
}
