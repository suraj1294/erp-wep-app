"use server"

import { revalidatePath } from "next/cache"
import { and, eq, ne } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { companies, companyUsers } from "@workspace/db/schema"
import { seedCompanyDefaults } from "@workspace/db/seeds/company-defaults"
import { requireCompanyAccess } from "@/lib/company-access"
import { requireSession } from "@/lib/auth-server"

type ActionResult = {
  ok: boolean
  message: string
  redirectCompanyId?: string
  companyId?: string
}

const ROLE_HIERARCHY: Record<string, number> = {
  viewer: 0,
  accountant: 1,
  admin: 2,
  owner: 3,
}

function hasMinimumRole(role: string, minimumRole: string) {
  return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[minimumRole] ?? 0)
}

async function getTargetMembership(userId: string, targetCompanyId: string) {
  const [membership] = await db
    .select({
      role: companyUsers.role,
      membershipActive: companyUsers.isActive,
      companyActive: companies.isActive,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(
      and(
        eq(companyUsers.userId, userId),
        eq(companyUsers.companyId, targetCompanyId)
      )
    )
    .limit(1)

  if (!membership) {
    throw new Error("You do not have access to this company")
  }

  return membership
}

export async function createCompanyFromSettings(
  currentCompanyId: string,
  input: {
    name: string
    displayName?: string
  }
): Promise<ActionResult> {
  await requireCompanyAccess(currentCompanyId)
  const session = await requireSession()

  const name = input.name.trim()
  const displayName = input.displayName?.trim() || null

  if (!name) {
    return { ok: false, message: "Company name is required." }
  }

  const [company] = await db
    .insert(companies)
    .values({
      name,
      displayName,
      createdBy: session.user.id,
    })
    .returning({ id: companies.id })

  if (!company) {
    return { ok: false, message: "Failed to create company." }
  }

  await db.insert(companyUsers).values({
    companyId: company.id,
    userId: session.user.id,
    role: "owner",
  })

  await seedCompanyDefaults(company.id)

  revalidatePath(`/${currentCompanyId}/settings`)

  return {
    ok: true,
    message: "Company created successfully.",
    companyId: company.id,
  }
}

export async function updateManagedCompany(
  currentCompanyId: string,
  targetCompanyId: string,
  input: {
    name: string
    displayName?: string
    email?: string
    phone?: string
    gstin?: string
    pan?: string
  }
): Promise<ActionResult> {
  await requireCompanyAccess(currentCompanyId)
  const session = await requireSession()
  const membership = await getTargetMembership(session.user.id, targetCompanyId)

  if (!hasMinimumRole(membership.role, "admin")) {
    return {
      ok: false,
      message: "Only admins or owners can update company details.",
    }
  }

  const name = input.name.trim()
  if (!name) {
    return { ok: false, message: "Company name is required." }
  }

  await db
    .update(companies)
    .set({
      name,
      displayName: input.displayName?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      gstin: input.gstin?.trim() || null,
      pan: input.pan?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, targetCompanyId))

  revalidatePath(`/${currentCompanyId}/settings`)
  if (currentCompanyId !== targetCompanyId) {
    revalidatePath(`/${targetCompanyId}`)
  }

  return { ok: true, message: "Company updated successfully." }
}

export async function disableManagedCompany(
  currentCompanyId: string,
  targetCompanyId: string
): Promise<ActionResult> {
  await requireCompanyAccess(currentCompanyId)
  const session = await requireSession()
  const membership = await getTargetMembership(session.user.id, targetCompanyId)

  if (!hasMinimumRole(membership.role, "owner")) {
    return {
      ok: false,
      message: "Only owners can disable a company.",
    }
  }

  if (!membership.companyActive) {
    return { ok: false, message: "This company is already disabled." }
  }

  const activeCompanies = await db
    .select({ id: companies.id })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(
      and(
        eq(companyUsers.userId, session.user.id),
        eq(companyUsers.isActive, true),
        eq(companies.isActive, true)
      )
    )

  if (activeCompanies.length <= 1) {
    return {
      ok: false,
      message: "You must keep at least one active company.",
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(companies)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, targetCompanyId))

    await tx
      .update(companyUsers)
      .set({ isActive: false })
      .where(eq(companyUsers.companyId, targetCompanyId))
  })

  const [fallbackCompany] = await db
    .select({ id: companies.id })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(
      and(
        eq(companyUsers.userId, session.user.id),
        eq(companyUsers.isActive, true),
        eq(companies.isActive, true),
        ne(companies.id, targetCompanyId)
      )
    )
    .limit(1)

  revalidatePath(`/${currentCompanyId}/settings`)

  return {
    ok: true,
    message: "Company disabled successfully.",
    redirectCompanyId:
      targetCompanyId === currentCompanyId ? fallbackCompany?.id : undefined,
  }
}
