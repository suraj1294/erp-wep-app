"use server"

import { revalidatePath } from "next/cache"
import { seedCompanyDefaults } from "@workspace/db/seeds/company-defaults"
import {
  addCompanyOwnerMembership,
  disableCompanyAndMemberships,
  getCompanySettingsRecord,
  getCompanySlugById,
  getFallbackActiveCompany,
  getTargetCompanyMembership,
  listActiveAccessibleCompanies,
  getSampleDataSeedProgress,
  seedSampleData,
  type SampleDataSeedProgress,
  updateManagedCompany as updateManagedCompanyRecord,
} from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { requireSession } from "@/lib/auth-server"
import { createCompanyRecord } from "@/lib/company-slug"

type ActionResult = {
  ok: boolean
  message: string
  redirectCompanySlug?: string
  companyId?: string
  companySlug?: string
  sampleDataSeedProgress?: SampleDataSeedProgress | null
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
  const membership = await getTargetCompanyMembership(userId, targetCompanyId)

  if (!membership) {
    throw new Error("You do not have access to this company")
  }

  return membership
}

export async function createCompanyFromSettings(
  currentCompanySlug: string,
  input: {
    name: string
    displayName?: string
  }
): Promise<ActionResult> {
  const { company: currentCompany } =
    await requireCompanyAccess(currentCompanySlug)
  const session = await requireSession()

  const name = input.name.trim()
  const displayName = input.displayName?.trim() || null

  if (!name) {
    return { ok: false, message: "Company name is required." }
  }

  const company = await createCompanyRecord({
    name,
    displayName,
    createdBy: session.user.id,
  })

  if (!company) {
    return { ok: false, message: "Failed to create company." }
  }

  await addCompanyOwnerMembership(company.id, session.user.id)

  await seedCompanyDefaults(company.id)

  revalidatePath(`/${currentCompany.slug}/settings`)

  return {
    ok: true,
    message: "Company created successfully.",
    companyId: company.id,
    companySlug: company.slug,
  }
}

export async function updateManagedCompany(
  currentCompanySlug: string,
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
  const { company: currentCompany } =
    await requireCompanyAccess(currentCompanySlug)
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

  await updateManagedCompanyRecord(targetCompanyId, {
    name,
    displayName: input.displayName?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    gstin: input.gstin?.trim() || null,
    pan: input.pan?.trim() || null,
  })

  revalidatePath(`/${currentCompany.slug}/settings`)
  if (currentCompany.id !== targetCompanyId) {
    const targetCompanySlug = await getCompanySlugById(targetCompanyId)

    if (targetCompanySlug) {
      revalidatePath(`/${targetCompanySlug}`)
    }
  }

  return { ok: true, message: "Company updated successfully." }
}

export async function disableManagedCompany(
  currentCompanySlug: string,
  targetCompanyId: string
): Promise<ActionResult> {
  const { company: currentCompany } =
    await requireCompanyAccess(currentCompanySlug)
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

  const activeCompanies = await listActiveAccessibleCompanies(session.user.id)

  if (activeCompanies.length <= 1) {
    return {
      ok: false,
      message: "You must keep at least one active company.",
    }
  }

  await disableCompanyAndMemberships(targetCompanyId)

  const fallbackCompany = await getFallbackActiveCompany(
    session.user.id,
    targetCompanyId
  )

  revalidatePath(`/${currentCompany.slug}/settings`)

  return {
    ok: true,
    message: "Company disabled successfully.",
    redirectCompanySlug:
      targetCompanyId === currentCompany.id ? fallbackCompany?.slug : undefined,
  }
}

export async function seedSampleDataAction(
  companySlug: string
): Promise<ActionResult> {
  const { session, company, membership } =
    await requireCompanyAccess(companySlug)

  if (!hasMinimumRole(membership.role, "admin")) {
    return {
      ok: false,
      message: "Only admins or owners can seed sample data.",
    }
  }

  const result = await seedSampleData(company.id, session.user.id)
  const companyRow = await getCompanySettingsRecord(company.id)

  revalidatePath(`/${company.slug}`)
  revalidatePath(`/${company.slug}/settings`)

  return {
    ...result,
    sampleDataSeedProgress: getSampleDataSeedProgress(companyRow?.settings),
  }
}
