import { getAccountVoucherFormData } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { AccountVoucherForm } from "@/components/vouchers/account-voucher-form"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function NewJournalPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const formData = await getAccountVoucherFormData(company.id, "journal")

  return (
    <AccountVoucherForm
      companyId={company.id}
      voucherClass="journal"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      accounts={formData.accounts}
      cashBankAccounts={formData.cashBankAccounts}
      backHref={`/${company.slug}/journal`}
      title="New Journal Entry"
      listHref={`/${company.slug}/journal`}
    />
  )
}
