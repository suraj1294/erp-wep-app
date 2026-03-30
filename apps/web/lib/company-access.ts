import { eq, and, or } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { companies, companyUsers } from "@workspace/db/schema"
import { requireSession } from "./auth-server"

const UUID_LIKE_REFERENCE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  accountant: 1,
  admin: 2,
  owner: 3,
}

export async function requireCompanyAccess(
  companyReference: string,
  minimumRole?: string
) {
  const session = await requireSession()
  const isUuidReference = UUID_LIKE_REFERENCE.test(companyReference)

  const [membership] = await db
    .select({
      id: companyUsers.id,
      role: companyUsers.role,
      isActive: companyUsers.isActive,
      companyId: companies.id,
      companySlug: companies.slug,
      companyName: companies.name,
      companyDisplayName: companies.displayName,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(
      and(
        isUuidReference
          ? or(
              eq(companyUsers.companyId, companyReference),
              eq(companies.slug, companyReference)
            )
          : eq(companies.slug, companyReference),
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

  return {
    session,
    membership: {
      id: membership.id,
      role: membership.role,
      isActive: membership.isActive,
    },
    company: {
      id: membership.companyId,
      slug: membership.companySlug,
      name: membership.companyName,
      displayName: membership.companyDisplayName,
    },
  }
}
