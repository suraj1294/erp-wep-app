import { getVoucherFormData, type AccountVoucherFormPayload } from "@/lib/server-api"
import { AccountVoucherForm } from "@/components/vouchers/account-voucher-form"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function NewJournalPage({ params }: PageProps) {
  const { companySlug } = await params
  const formData = (await getVoucherFormData(
    companySlug,
    "journal"
  )) as AccountVoucherFormPayload

  return (
    <AccountVoucherForm
      companySlug={formData.companySlug}
      voucherClass="journal"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      accounts={formData.accounts}
      cashBankAccounts={formData.cashBankAccounts}
      backHref={`/${formData.companySlug}/journal`}
      title="New Journal Entry"
      listHref={`/${formData.companySlug}/journal`}
    />
  )
}
