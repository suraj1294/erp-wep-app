import { getVoucherFormData } from "@/lib/server-api"
import { AccountVoucherForm } from "@/components/vouchers/account-voucher-form"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function NewReceiptPage({ params }: PageProps) {
  const { companySlug } = await params
  const formData = await getVoucherFormData(companySlug, "receipt")

  return (
    <AccountVoucherForm
      companyId={formData.companyId}
      voucherClass="receipt"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      accounts={formData.accounts}
      cashBankAccounts={formData.cashBankAccounts}
      backHref={`/${formData.companySlug}/banking`}
      title="New Receipt"
      listHref={`/${formData.companySlug}/banking`}
    />
  )
}
