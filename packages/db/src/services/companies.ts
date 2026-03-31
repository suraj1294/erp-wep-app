import { and, asc, desc, eq, ne, or } from "drizzle-orm"
import { db } from "../client"
import { companies, companyUsers } from "../schema"

const COMPANY_SLUG_MAX_LENGTH = 120

const RESERVED_COMPANY_SLUGS = new Set([
  "api",
  "app",
  "create-company",
  "favicon.ico",
  "robots.txt",
  "sign-in",
  "sign-up",
])

const UUID_LIKE_SLUG =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeSlugPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

function formatSlug(base: string, suffix?: number) {
  if (!suffix) {
    return base.slice(0, COMPANY_SLUG_MAX_LENGTH)
  }

  const suffixText = `-${suffix}`
  const truncatedBase = base.slice(0, COMPANY_SLUG_MAX_LENGTH - suffixText.length)
  return `${truncatedBase}${suffixText}`
}

function isReservedCompanySlug(slug: string) {
  return RESERVED_COMPANY_SLUGS.has(slug) || UUID_LIKE_SLUG.test(slug)
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  )
}

export function slugifyCompanyName(name: string) {
  let slug = normalizeSlugPart(name)

  if (!slug) {
    slug = "company"
  }

  if (isReservedCompanySlug(slug)) {
    slug = `company-${slug}`.slice(0, COMPANY_SLUG_MAX_LENGTH)
  }

  return slug
}

export async function generateUniqueCompanySlug(name: string) {
  const baseSlug = slugifyCompanyName(name)

  for (let suffix = 0; suffix < 10_000; suffix += 1) {
    const candidate = formatSlug(baseSlug, suffix === 0 ? undefined : suffix + 1)

    const existing = await db.query.companies.findFirst({
      columns: { id: true },
      where: eq(companies.slug, candidate),
    })

    if (!existing) {
      return candidate
    }
  }

  throw new Error("Could not generate a unique company slug")
}

export async function createCompanyRecord(input: {
  name: string
  displayName?: string | null
  createdBy: string
  email?: string | null
  phone?: string | null
  gstin?: string | null
  pan?: string | null
}) {
  const normalizedName = input.name.trim()
  const normalizedDisplayName = input.displayName?.trim() || null
  const normalizedEmail = input.email?.trim() || null
  const normalizedPhone = input.phone?.trim() || null
  const normalizedGstin = input.gstin?.trim() || null
  const normalizedPan = input.pan?.trim() || null

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = await generateUniqueCompanySlug(normalizedName)

    try {
      const [company] = await db
        .insert(companies)
        .values({
          name: normalizedName,
          slug,
          displayName: normalizedDisplayName,
          email: normalizedEmail,
          phone: normalizedPhone,
          gstin: normalizedGstin,
          pan: normalizedPan,
          createdBy: input.createdBy,
        })
        .returning()

      return company!
    } catch (error) {
      if (isUniqueViolation(error)) {
        continue
      }

      throw error
    }
  }

  throw new Error("Failed to create company with a unique slug")
}

export async function addCompanyOwnerMembership(companyId: string, userId: string) {
  await db.insert(companyUsers).values({
    companyId,
    userId,
    role: "owner",
  })
}

export async function getCompanyAccessMembership(
  userId: string,
  companyReference: string
) {
  const isUuidReference = UUID_LIKE_SLUG.test(companyReference)

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
        eq(companyUsers.userId, userId),
        eq(companyUsers.isActive, true),
        eq(companies.isActive, true)
      )
    )
    .limit(1)

  return membership ?? null
}

export async function listActiveCompaniesForUser(userId: string) {
  return db
    .select({
      id: companies.id,
      slug: companies.slug,
      name: companies.name,
      displayName: companies.displayName,
      role: companyUsers.role,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(
      and(
        eq(companyUsers.userId, userId),
        eq(companyUsers.isActive, true),
        eq(companies.isActive, true)
      )
    )
    .orderBy(asc(companies.displayName), asc(companies.name), asc(companies.createdAt))
}

export async function getFirstActiveCompanyForUser(userId: string) {
  const [company] = await db
    .select({ companySlug: companies.slug })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(
      and(
        eq(companyUsers.userId, userId),
        eq(companyUsers.isActive, true),
        eq(companies.isActive, true)
      )
    )
    .orderBy(asc(companies.displayName), asc(companies.name), asc(companies.createdAt))
    .limit(1)

  return company ?? null
}

export async function listCompaniesForSettings(userId: string) {
  return db
    .select({
      id: companies.id,
      slug: companies.slug,
      name: companies.name,
      displayName: companies.displayName,
      email: companies.email,
      phone: companies.phone,
      gstin: companies.gstin,
      pan: companies.pan,
      isActive: companies.isActive,
      role: companyUsers.role,
      createdAt: companies.createdAt,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(eq(companyUsers.userId, userId))
    .orderBy(desc(companies.isActive), desc(companies.createdAt))
}

export async function getCompanySettingsRecord(companyId: string) {
  const [company] = await db
    .select({ settings: companies.settings })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1)

  return company ?? null
}

export async function getCompanySlugById(companyId: string) {
  const [company] = await db
    .select({ slug: companies.slug })
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1)

  return company?.slug ?? null
}

export async function getTargetCompanyMembership(userId: string, targetCompanyId: string) {
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

  return membership ?? null
}

export async function updateManagedCompany(
  companyId: string,
  input: {
    name: string
    displayName?: string | null
    email?: string | null
    phone?: string | null
    gstin?: string | null
    pan?: string | null
  }
) {
  await db
    .update(companies)
    .set({
      name: input.name,
      displayName: input.displayName ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      gstin: input.gstin ?? null,
      pan: input.pan ?? null,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, companyId))
}

export async function listActiveAccessibleCompanies(userId: string) {
  return db
    .select({ id: companies.id })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(
      and(
        eq(companyUsers.userId, userId),
        eq(companyUsers.isActive, true),
        eq(companies.isActive, true)
      )
    )
}

export async function disableCompanyAndMemberships(companyId: string) {
  await db.transaction(async (tx) => {
    await tx
      .update(companies)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId))

    await tx
      .update(companyUsers)
      .set({ isActive: false })
      .where(eq(companyUsers.companyId, companyId))
  })
}

export async function getFallbackActiveCompany(userId: string, excludedCompanyId: string) {
  const [company] = await db
    .select({ id: companies.id, slug: companies.slug })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(
      and(
        eq(companyUsers.userId, userId),
        eq(companyUsers.isActive, true),
        eq(companies.isActive, true),
        ne(companies.id, excludedCompanyId)
      )
    )
    .limit(1)

  return company ?? null
}
