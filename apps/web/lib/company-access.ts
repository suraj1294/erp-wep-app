import { getCompanyAccessMembership } from "@workspace/db"
import { requireSession } from "./auth-server"

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
  const membership = await getCompanyAccessMembership(session.user.id, companyReference)

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
