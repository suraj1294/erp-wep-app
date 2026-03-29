import { config } from "dotenv"
import postgres from "postgres"
import { resolve } from "node:path"
import process from "node:process"

config({ path: resolve(process.cwd(), "../../apps/web/.env.local") })
config({ path: resolve(process.cwd(), ".env") })

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set")
  process.exit(1)
}

function parseArgs(argv) {
  const args = {
    companyId: "",
    name: "",
    dryRun: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === "--company-id") {
      args.companyId = argv[index + 1] ?? ""
      index += 1
    } else if (arg === "--name") {
      args.name = argv[index + 1] ?? ""
      index += 1
    } else if (arg === "--dry-run") {
      args.dryRun = true
    }
  }

  return args
}

function usage() {
  console.log(
    [
      "Usage:",
      "  pnpm --filter @workspace/db db:delete-company -- --company-id <uuid>",
      "  pnpm --filter @workspace/db db:delete-company -- --name <exact company name>",
      "  pnpm --filter @workspace/db db:delete-company -- --company-id <uuid> --dry-run",
    ].join("\n")
  )
}

const args = parseArgs(process.argv.slice(2))
if ((!args.companyId && !args.name) || (args.companyId && args.name)) {
  usage()
  process.exit(1)
}

const sql = postgres(connectionString, { max: 1 })

try {
  const companyRows = args.companyId
    ? await sql`
        select id, name, display_name
        from companies
        where id = ${args.companyId}
      `
    : await sql`
        select id, name, display_name
        from companies
        where name = ${args.name}
      `

  if (companyRows.length === 0) {
    console.error("No matching company found.")
    process.exit(1)
  }

  if (companyRows.length > 1) {
    console.error("More than one company matched. Use --company-id instead.")
    for (const row of companyRows) {
      console.error(`- ${row.id} | ${row.name}`)
    }
    process.exit(1)
  }

  const company = companyRows[0]
  const companyId = company.id

  const counts = {
    company_users: await sql`select count(*)::int as count from company_users where company_id = ${companyId}`,
    voucher_items: await sql`
      select count(*)::int as count
      from voucher_items
      where voucher_id in (
        select id from vouchers where company_id = ${companyId}
      )
    `,
    stock_movements: await sql`select count(*)::int as count from stock_movements where company_id = ${companyId}`,
    vouchers: await sql`select count(*)::int as count from vouchers where company_id = ${companyId}`,
    voucher_types: await sql`select count(*)::int as count from voucher_types where company_id = ${companyId}`,
    parties: await sql`select count(*)::int as count from parties where company_id = ${companyId}`,
    items: await sql`select count(*)::int as count from items where company_id = ${companyId}`,
    locations: await sql`select count(*)::int as count from locations where company_id = ${companyId}`,
    units_of_measure: await sql`select count(*)::int as count from units_of_measure where company_id = ${companyId}`,
    tax_rates: await sql`select count(*)::int as count from tax_rates where company_id = ${companyId}`,
    accounts: await sql`select count(*)::int as count from accounts where company_id = ${companyId}`,
    account_groups: await sql`select count(*)::int as count from account_groups where company_id = ${companyId}`,
  }

  console.log(`Matched company: ${company.id} | ${company.name}`)
  console.table(
    Object.entries(counts).map(([table, rows]) => ({
      table,
      rows: rows[0].count,
    }))
  )

  if (args.dryRun) {
    console.log("Dry run only. No rows deleted.")
    process.exit(0)
  }

  await sql.begin(async (tx) => {
    await tx`
      delete from voucher_items
      where voucher_id in (
        select id from vouchers where company_id = ${companyId}
      )
    `
    await tx`delete from stock_movements where company_id = ${companyId}`
    await tx`delete from vouchers where company_id = ${companyId}`
    await tx`delete from voucher_types where company_id = ${companyId}`
    await tx`delete from parties where company_id = ${companyId}`
    await tx`delete from items where company_id = ${companyId}`
    await tx`delete from locations where company_id = ${companyId}`
    await tx`delete from units_of_measure where company_id = ${companyId}`
    await tx`delete from tax_rates where company_id = ${companyId}`
    await tx`delete from accounts where company_id = ${companyId}`
    await tx`delete from account_groups where company_id = ${companyId}`
    await tx`delete from company_users where company_id = ${companyId}`
    await tx`delete from companies where id = ${companyId}`
  })

  console.log("Company and related data deleted successfully.")
} finally {
  await sql.end()
}
