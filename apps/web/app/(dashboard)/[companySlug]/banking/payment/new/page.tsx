import { getVoucherFormData } from "@/lib/server-api"
import { AccountVoucherForm } from "@/components/vouchers/account-voucher-form"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function NewPaymentPage({ params }: PageProps) {
  const { companySlug } = await params
  const formData = await getVoucherFormData(companySlug, "payment")

  return (
    <AccountVoucherForm
      companyId={formData.companyId}
      voucherClass="payment"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      accounts={formData.accounts}
      cashBankAccounts={formData.cashBankAccounts}
      backHref={`/${formData.companySlug}/banking`}
      title="New Payment"
      listHref={`/${formData.companySlug}/banking`}
    />
  )
}
