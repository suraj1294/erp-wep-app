import { eq, and, asc, inArray } from "drizzle-orm"
import { db } from "@workspace/db/client"
import {
  voucherTypes,
  parties,
  accounts,
  accountGroups,
} from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { AccountVoucherForm } from "@/components/vouchers/account-voucher-form"

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function NewContraPage({ params }: PageProps) {
  const { companyId } = await params
  await requireCompanyAccess(companyId)

  const CASH_BANK_CODES = ["CASH-GRP", "BANK-GRP"]
  const cashBankGroups = await db
    .select({ id: accountGroups.id })
    .from(accountGroups)
    .where(
      and(
        eq(accountGroups.companyId, companyId),
        inArray(accountGroups.code, CASH_BANK_CODES)
      )
    )
  const cashBankGroupIds = cashBankGroups.map((g) => g.id)

  const [contraTypes, cashBankAccounts] = await Promise.all([
    db
      .select({
        id: voucherTypes.id,
        name: voucherTypes.name,
        prefix: voucherTypes.prefix,
        currentNumber: voucherTypes.currentNumber,
      })
      .from(voucherTypes)
      .where(
        and(
          eq(voucherTypes.companyId, companyId),
          eq(voucherTypes.voucherClass, "contra"),
          eq(voucherTypes.isActive, true)
        )
      )
      .orderBy(asc(voucherTypes.name)),

    cashBankGroupIds.length > 0
      ? db
          .select({
            id: accounts.id,
            name: accounts.name,
            code: accounts.code,
            groupName: accountGroups.name,
          })
          .from(accounts)
          .leftJoin(accountGroups, eq(accounts.groupId, accountGroups.id))
          .where(
            and(
              eq(accounts.companyId, companyId),
              eq(accounts.isActive, true),
              inArray(accounts.groupId, cashBankGroupIds)
            )
          )
          .orderBy(asc(accounts.name))
      : db
          .select({
            id: accounts.id,
            name: accounts.name,
            code: accounts.code,
            groupName: accountGroups.name,
          })
          .from(accounts)
          .leftJoin(accountGroups, eq(accounts.groupId, accountGroups.id))
          .where(
            and(eq(accounts.companyId, companyId), eq(accounts.isActive, true))
          )
          .orderBy(asc(accounts.name)),
  ])

  return (
    <AccountVoucherForm
      companyId={companyId}
      voucherClass="contra"
      voucherTypes={contraTypes.map((vt) => ({
        ...vt,
        currentNumber: vt.currentNumber ?? 1,
      }))}
      parties={[]}
      accounts={cashBankAccounts}
      cashBankAccounts={cashBankAccounts}
      backHref={`/${companyId}/banking`}
      title="New Contra Entry"
      listHref={`/${companyId}/banking`}
    />
  )
}
