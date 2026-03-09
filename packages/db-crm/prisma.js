import { PrismaClient } from "./generated/client/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { readFileSync } from "node:fs";

const globalForPrisma = globalThis;

const readSecret = (path) => readFileSync(path, "utf8").trim();
const fromEnvOrFile = (name) => {
  const direct = process.env[name];
  if (direct) return direct;
  const filePath = process.env[`${name}_FILE`];
  if (filePath) return readSecret(filePath);
  return undefined;
};

const databaseUrl =
  fromEnvOrFile("DATABASE_URL") ||
  (() => {
    const protocol = fromEnvOrFile("DB_PROTOCOL");
    const user = fromEnvOrFile("DB_USER");
    const password = fromEnvOrFile("DB_PASSWORD");
    const host = fromEnvOrFile("DB_HOST");
    const port = fromEnvOrFile("DB_PORT");
    const dbName = fromEnvOrFile("DB_NAME");
    if (!protocol || !user || !password || !host || !port || !dbName) return undefined;
    return `${protocol}://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${dbName}`;
  })();

if (!databaseUrl) throw new Error("DATABASE_URL or DB_* / DB_*_FILE variables are missing.");

export const prisma =
  globalForPrisma.prismaCrm ??
  new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaCrm = prisma;
