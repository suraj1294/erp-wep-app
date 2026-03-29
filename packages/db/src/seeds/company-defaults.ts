/**
 * Seeds a newly created company with standard Tally-style masters:
 *   - Account groups  (primary + sub-groups, 2 levels)
 *   - Default accounts (cash, capital, purchase, sales, taxes, etc.)
 *   - Voucher types   (contra, payment, receipt, journal, sales, purchase, CN, DN)
 *   - Units of measure (Nos, Kg, Ltr, Mtr, Pcs, Box, Doz)
 *   - Default location (Main Godown)
 *
 * All operations run inside a single transaction so the company either gets
 * a complete set of masters or nothing at all.
 */

import { db } from "../client"
import {
  accountGroups,
  accounts,
  voucherTypes,
  unitsOfMeasure,
  locations,
} from "../schema"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GroupRecord = { id: string; name: string }

// ---------------------------------------------------------------------------
// Level-1 primary group definitions
// ---------------------------------------------------------------------------

const PRIMARY_GROUPS = [
  { name: "Capital Account",     code: "CAP",    accountType: "equity",     nature: "credit", level: 1 },
  { name: "Loans (Liability)",   code: "LOANS",  accountType: "liability",  nature: "credit", level: 1 },
  { name: "Current Liabilities", code: "CL",     accountType: "liability",  nature: "credit", level: 1 },
  { name: "Fixed Assets",        code: "FA",     accountType: "asset",      nature: "debit",  level: 1 },
  { name: "Current Assets",      code: "CA",     accountType: "asset",      nature: "debit",  level: 1 },
  { name: "Income",              code: "INC",    accountType: "income",     nature: "credit", level: 1 },
  { name: "Direct Expenses",     code: "DEXP",   accountType: "expense",    nature: "debit",  level: 1 },
  { name: "Indirect Expenses",   code: "IEXP",   accountType: "expense",    nature: "debit",  level: 1 },
] as const

// ---------------------------------------------------------------------------
// Level-2 sub-group definitions (reference parent by name)
// ---------------------------------------------------------------------------

const SUB_GROUPS = [
  // Under Capital Account
  { name: "Reserves & Surplus",      code: "RES",       parent: "Capital Account",     accountType: "equity",    nature: "credit", level: 2 },

  // Under Loans (Liability)
  { name: "Secured Loans",           code: "SEC-LOAN",  parent: "Loans (Liability)",   accountType: "liability", nature: "credit", level: 2 },
  { name: "Unsecured Loans",         code: "UNSEC-LOAN",parent: "Loans (Liability)",   accountType: "liability", nature: "credit", level: 2 },
  { name: "Bank OD Accounts",        code: "BANK-OD",   parent: "Loans (Liability)",   accountType: "liability", nature: "credit", level: 2 },

  // Under Current Liabilities
  { name: "Duties & Taxes",          code: "DUTIES",    parent: "Current Liabilities", accountType: "liability", nature: "credit", level: 2 },
  { name: "Provisions",              code: "PROV",      parent: "Current Liabilities", accountType: "liability", nature: "credit", level: 2 },
  { name: "Sundry Creditors",        code: "CRED",      parent: "Current Liabilities", accountType: "liability", nature: "credit", level: 2 },

  // Under Current Assets
  { name: "Cash-in-Hand",            code: "CASH-GRP",  parent: "Current Assets",      accountType: "asset",     nature: "debit",  level: 2 },
  { name: "Bank Accounts",           code: "BANK-GRP",  parent: "Current Assets",      accountType: "asset",     nature: "debit",  level: 2 },
  { name: "Deposits (Asset)",        code: "DEP",       parent: "Current Assets",      accountType: "asset",     nature: "debit",  level: 2 },
  { name: "Loans & Advances (Asset)",code: "LA-ASSET",  parent: "Current Assets",      accountType: "asset",     nature: "debit",  level: 2 },
  { name: "Stock-in-Hand",           code: "STK-GRP",   parent: "Current Assets",      accountType: "asset",     nature: "debit",  level: 2 },
  { name: "Sundry Debtors",          code: "DEBT",      parent: "Current Assets",      accountType: "asset",     nature: "debit",  level: 2 },

  // Under Income
  { name: "Sales Accounts",          code: "SALES-GRP", parent: "Income",              accountType: "income",    nature: "credit", level: 2 },
  { name: "Indirect Incomes",        code: "IINC",      parent: "Income",              accountType: "income",    nature: "credit", level: 2 },

  // Under Direct Expenses
  { name: "Purchase Accounts",       code: "PUR-GRP",   parent: "Direct Expenses",     accountType: "expense",   nature: "debit",  level: 2 },
] as const

// ---------------------------------------------------------------------------
// Default account definitions (reference parent group by name)
// ---------------------------------------------------------------------------

const DEFAULT_ACCOUNTS = [
  // Assets
  { name: "Cash",                    code: "CASH",         group: "Cash-in-Hand",             isSystem: true  },
  { name: "Opening Stock",           code: "OPENING-STK",  group: "Stock-in-Hand",            isSystem: true  },

  // Equity
  { name: "Capital Account",         code: "CAPITAL",      group: "Capital Account",          isSystem: true  },

  // Revenue / Expenses
  { name: "Sales",                   code: "SALES",        group: "Sales Accounts",           isSystem: true  },
  { name: "Purchase",                code: "PURCHASE",     group: "Purchase Accounts",        isSystem: true  },
  { name: "Freight & Forwarding",    code: "FREIGHT",      group: "Direct Expenses",          isSystem: false },
  { name: "Discount Allowed",        code: "DISC-ALLOWED", group: "Indirect Expenses",        isSystem: false },
  { name: "Discount Received",       code: "DISC-RECEIVED",group: "Indirect Incomes",         isSystem: false },
  { name: "Round Off",               code: "ROUND-OFF",    group: "Indirect Expenses",        isSystem: false },

  // Taxes
  { name: "GST Input Credit",        code: "GST-INPUT",    group: "Duties & Taxes",           isSystem: false },
  { name: "GST Output",              code: "GST-OUTPUT",   group: "Duties & Taxes",           isSystem: false },
  { name: "TDS Payable",             code: "TDS-PAY",      group: "Duties & Taxes",           isSystem: false },
] as const

// ---------------------------------------------------------------------------
// Voucher type definitions
// ---------------------------------------------------------------------------

const DEFAULT_VOUCHER_TYPES = [
  { name: "Contra",         code: "CONTRA", voucherClass: "contra",      prefix: "CON",  startingNumber: 1 },
  { name: "Payment",        code: "PMT",    voucherClass: "payment",     prefix: "PMT",  startingNumber: 1 },
  { name: "Receipt",        code: "RCT",    voucherClass: "receipt",     prefix: "RCT",  startingNumber: 1 },
  { name: "Journal",        code: "JNL",    voucherClass: "journal",     prefix: "JNL",  startingNumber: 1 },
  { name: "Sales Invoice",  code: "SAL",    voucherClass: "sales",       prefix: "INV",  startingNumber: 1 },
  { name: "Purchase Bill",  code: "PUR",    voucherClass: "purchase",    prefix: "BILL", startingNumber: 1 },
  { name: "Credit Note",    code: "CN",     voucherClass: "credit_note", prefix: "CN",   startingNumber: 1 },
  { name: "Debit Note",     code: "DN",     voucherClass: "debit_note",  prefix: "DN",   startingNumber: 1 },
] as const

// ---------------------------------------------------------------------------
// Units of measure definitions
// ---------------------------------------------------------------------------

const DEFAULT_UNITS = [
  { name: "Numbers",   symbol: "Nos", decimalPlaces: 0, isBaseUnit: true  },
  { name: "Kilograms", symbol: "Kg",  decimalPlaces: 3, isBaseUnit: true  },
  { name: "Litres",    symbol: "Ltr", decimalPlaces: 3, isBaseUnit: true  },
  { name: "Metres",    symbol: "Mtr", decimalPlaces: 2, isBaseUnit: true  },
  { name: "Pieces",    symbol: "Pcs", decimalPlaces: 0, isBaseUnit: true  },
  { name: "Box",       symbol: "Box", decimalPlaces: 0, isBaseUnit: false },
  { name: "Dozen",     symbol: "Doz", decimalPlaces: 0, isBaseUnit: false },
] as const

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

export async function seedCompanyDefaults(companyId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // ------------------------------------------------------------------
    // 1. Insert primary account groups (level 1)
    // ------------------------------------------------------------------
    const primaryRows = await tx
      .insert(accountGroups)
      .values(
        PRIMARY_GROUPS.map((g) => ({
          companyId,
          name: g.name,
          code: g.code,
          accountType: g.accountType,
          nature: g.nature,
          level: g.level,
          isSystem: true,
        }))
      )
      .returning({ id: accountGroups.id, name: accountGroups.name })

    const primaryById: Record<string, string> = {}
    for (const row of primaryRows) {
      primaryById[row.name] = row.id
    }

    // ------------------------------------------------------------------
    // 2. Insert sub-groups (level 2), referencing primary group IDs
    // ------------------------------------------------------------------
    const subRows = await tx
      .insert(accountGroups)
      .values(
        SUB_GROUPS.map((g) => ({
          companyId,
          name: g.name,
          code: g.code,
          accountType: g.accountType,
          nature: g.nature,
          level: g.level,
          parentId: primaryById[g.parent],
          isSystem: true,
        }))
      )
      .returning({ id: accountGroups.id, name: accountGroups.name })

    // Build a unified name→id map covering all groups
    const groupById: Record<string, string> = { ...primaryById }
    for (const row of subRows) {
      groupById[row.name] = row.id
    }

    // ------------------------------------------------------------------
    // 3. Insert default accounts
    // ------------------------------------------------------------------
    await tx.insert(accounts).values(
      DEFAULT_ACCOUNTS.map((a) => ({
        companyId,
        name: a.name,
        code: a.code,
        groupId: groupById[a.group],
        isSystem: a.isSystem,
      }))
    )

    // ------------------------------------------------------------------
    // 4. Insert voucher types
    // ------------------------------------------------------------------
    await tx.insert(voucherTypes).values(
      DEFAULT_VOUCHER_TYPES.map((v) => ({
        companyId,
        name: v.name,
        code: v.code,
        voucherClass: v.voucherClass,
        prefix: v.prefix,
        startingNumber: v.startingNumber,
        currentNumber: v.startingNumber,
        numberingMethod: "automatic",
      }))
    )

    // ------------------------------------------------------------------
    // 5. Insert units of measure
    // ------------------------------------------------------------------
    await tx.insert(unitsOfMeasure).values(
      DEFAULT_UNITS.map((u) => ({
        companyId,
        name: u.name,
        symbol: u.symbol,
        decimalPlaces: u.decimalPlaces,
        isBaseUnit: u.isBaseUnit,
      }))
    )

    // ------------------------------------------------------------------
    // 6. Insert default location
    // ------------------------------------------------------------------
    await tx.insert(locations).values({
      companyId,
      name: "Main Godown",
      code: "MAIN",
      isDefault: true,
    })
  })
}
