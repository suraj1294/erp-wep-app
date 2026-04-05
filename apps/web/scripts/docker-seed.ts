import { randomUUID } from "node:crypto"
import { and, asc, eq } from "drizzle-orm"
import { hashPassword } from "better-auth/crypto"
import {
  account,
  addCompanyOwnerMembership,
  companies,
  companyUsers,
  createCompanyRecord,
  db,
  seedCompanyDefaults,
  seedSampleData,
  user,
} from "@workspace/db"

function getEnv(name: string, fallback: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    return fallback
  }

  return value
}

const demoUserName = getEnv("DEMO_USER_NAME", "Demo User")
const demoUserEmail = getEnv("DEMO_USER_EMAIL", "demo@example.com").toLowerCase()
const demoUserPassword = getEnv("DEMO_USER_PASSWORD", "password123")
const demoCompanyName = getEnv("DEMO_COMPANY_NAME", "Acme Corp Ltd")

async function ensureDemoUser() {
  const [existingUser] = await db
    .select({
      id: user.id,
      name: user.name,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .where(eq(user.email, demoUserEmail))
    .limit(1)

  const passwordHash = await hashPassword(demoUserPassword)

  if (existingUser) {
    await db
      .update(user)
      .set({
        name: demoUserName,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(user.id, existingUser.id))

    const [credentialAccount] = await db
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, existingUser.id),
          eq(account.providerId, "credential")
        )
      )
      .limit(1)

    if (credentialAccount) {
      await db
        .update(account)
        .set({
          accountId: existingUser.id,
          password: passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(account.id, credentialAccount.id))
    } else {
      await db.insert(account).values({
        id: randomUUID(),
        accountId: existingUser.id,
        providerId: "credential",
        userId: existingUser.id,
        password: passwordHash,
      })
    }

    return existingUser.id
  }

  const userId = randomUUID()

  await db.insert(user).values({
    id: userId,
    name: demoUserName,
    email: demoUserEmail,
    emailVerified: true,
  })

  await db.insert(account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
  })

  return userId
}

async function ensureCompany(userId: string) {
  const [existingCompany] = await db
    .select({
      id: companies.id,
      name: companies.name,
      slug: companies.slug,
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
    .orderBy(asc(companies.createdAt))
    .limit(1)

  if (existingCompany) {
    return existingCompany
  }

  const company = await createCompanyRecord({
    name: demoCompanyName,
    displayName: demoCompanyName,
    createdBy: userId,
  })

  await addCompanyOwnerMembership(company.id, userId)
  await seedCompanyDefaults(company.id)

  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
  }
}

async function main() {
  console.log(`[seed] Ensuring demo user ${demoUserEmail}`)
  const demoUserId = await ensureDemoUser()

  console.log("[seed] Ensuring a company is available for the demo user")
  const company = await ensureCompany(demoUserId)

  console.log(`[seed] Seeding sample data for company ${company.slug}`)
  const result = await seedSampleData(company.id, demoUserId)

  console.log(`[seed] ${result.message}`)
  console.log(`[seed] Demo sign-in email: ${demoUserEmail}`)
  console.log(`[seed] Demo sign-in password: ${demoUserPassword}`)
  console.log(`[seed] Demo company slug: ${company.slug}`)
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error("[seed] Failed to prepare demo data")
    console.error(error)
    process.exit(1)
  })
