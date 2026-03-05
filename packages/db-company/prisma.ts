import { PrismaClient } from "./generated/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prismaCompany?: PrismaClient };

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is missing.");

export const prisma =
  globalForPrisma.prismaCompany ??
  new PrismaClient({
    adapter: new PrismaMariaDb(databaseUrl),
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaCompany = prisma;
