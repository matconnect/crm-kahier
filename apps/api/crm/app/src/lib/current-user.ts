import type { Request } from "express";
import { prisma } from "@kahier/db-crm";
import { fetchCompanyContext, fetchCompanyUsers, syncCompanySnapshot } from "./company-sync.js";

export type CurrentUser = {
  id: string;
  companyId: string;
  role: "USER" | "MANAGER" | "ADMIN";
  subscriptionType: string;
};

export function getHeaderValue(req: Request, key: string) {
  const value = req.headers[key];
  if (Array.isArray(value)) return value[0];
  if (typeof value === "string") return value;
  return null;
}

export function getParamValue(req: Request, key: string) {
  const value = (req.params as Record<string, string | string[] | undefined>)[key];
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}

export async function getCurrentUser(req: Request): Promise<CurrentUser | null> {
  const userId = getHeaderValue(req, "x-user-id")?.trim();
  if (!userId) return null;

  try {
    const context = await fetchCompanyContext(userId);
    if (!context.user?.companyId) return null;
    const users = await fetchCompanyUsers(context.user.companyId);
    await syncCompanySnapshot(context, users);

    return {
      id: context.user.id,
      companyId: context.user.companyId,
      role: context.user.role,
      subscriptionType: context.company.subscriptionType ?? "STARTER_FREE",
    };
  } catch (error) {
    console.error("crm current user sync", error);
    const localUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, companyId: true, role: true, company: { select: { subscriptionType: true } } },
    });
    if (!localUser?.companyId) return null;
    return {
      id: localUser.id,
      companyId: localUser.companyId,
      role: localUser.role as CurrentUser["role"],
      subscriptionType: localUser.company?.subscriptionType ?? "STARTER_FREE",
    };
  }
}
