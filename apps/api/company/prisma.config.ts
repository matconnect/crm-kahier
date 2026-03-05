import { defineConfig, env } from "prisma/config";
import "dotenv/config";
import { readFileSync } from "node:fs";

const readSecret = (path: string) => readFileSync(path, "utf8").trim();

const fromEnvOrFile = (name: string): string | undefined => {
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

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl ?? env("DATABASE_URL"),
  },
});
