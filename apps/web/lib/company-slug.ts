import { eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { companies } from "@workspace/db/schema"

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

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  )
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
