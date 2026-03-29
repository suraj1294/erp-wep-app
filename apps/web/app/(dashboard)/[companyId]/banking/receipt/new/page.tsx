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

export default async function NewReceiptPage({ params }: PageProps) {
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

  const [receiptTypes, allParties, allAccounts, cashBankAccounts] =
    await Promise.all([
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
            eq(voucherTypes.voucherClass, "receipt"),
            eq(voucherTypes.isActive, true)
          )
        )
        .orderBy(asc(voucherTypes.name)),

      db
        .select({
          id: parties.id,
          name: parties.name,
          displayName: parties.displayName,
          type: parties.type,
          accountId: parties.accountId,
          gstin: parties.gstin,
        })
        .from(parties)
        .where(
          and(eq(parties.companyId, companyId), eq(parties.isActive, true))
        )
        .orderBy(asc(parties.name)),

      db
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
        : Promise.resolve([] as Array<{id:string; name:string; code:string|null; groupName:string|null}>),
    ])

  return (
    <AccountVoucherForm
      companyId={companyId}
      voucherClass="receipt"
      voucherTypes={receiptTypes.map((vt) => ({
        ...vt,
        currentNumber: vt.currentNumber ?? 1,
      }))}
      parties={allParties}
      accounts={allAccounts}
      cashBankAccounts={cashBankAccounts.length > 0 ? cashBankAccounts : allAccounts}
      backHref={`/${companyId}/banking`}
      title="New Receipt"
      listHref={`/${companyId}/banking`}
    />
  )
}
