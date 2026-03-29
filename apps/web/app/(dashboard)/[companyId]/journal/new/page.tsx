import { eq, and, asc } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { voucherTypes, parties, accounts, accountGroups } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { AccountVoucherForm } from "@/components/vouchers/account-voucher-form"

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function NewJournalPage({ params }: PageProps) {
  const { companyId } = await params
  await requireCompanyAccess(companyId)

  const [journalTypes, allParties, allAccounts] = await Promise.all([
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
          eq(voucherTypes.voucherClass, "journal"),
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
  ])

  return (
    <AccountVoucherForm
      companyId={companyId}
      voucherClass="journal"
      voucherTypes={journalTypes.map((vt) => ({
        ...vt,
        currentNumber: vt.currentNumber ?? 1,
      }))}
      parties={allParties}
      accounts={allAccounts}
      cashBankAccounts={allAccounts}
      backHref={`/${companyId}/journal`}
      title="New Journal Entry"
      listHref={`/${companyId}/journal`}
    />
  )
}
