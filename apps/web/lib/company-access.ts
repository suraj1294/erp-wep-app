import { eq, and } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { companies, companyUsers } from "@workspace/db/schema"
import { requireSession } from "./auth-server"

const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  accountant: 1,
  admin: 2,
  owner: 3,
}

export async function requireCompanyAccess(
  companyId: string,
  minimumRole?: string
) {
  const session = await requireSession()

  const [membership] = await db
    .select({
      id: companyUsers.id,
      role: companyUsers.role,
      isActive: companyUsers.isActive,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(
      and(
        eq(companyUsers.companyId, companyId),
        eq(companyUsers.userId, session.user.id),
        eq(companyUsers.isActive, true),
        eq(companies.isActive, true)
      )
    )
    .limit(1)

  if (!membership) {
    throw new Error("You do not have access to this company")
  }

  if (minimumRole) {
    const userLevel = ROLE_HIERARCHY[membership.role] ?? 0
    const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0
    if (userLevel < requiredLevel) {
      throw new Error("Insufficient permissions")
    }
  }

  return { session, membership }
}
