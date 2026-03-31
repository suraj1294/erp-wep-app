import { getAccountVoucherFormData } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { AccountVoucherForm } from "@/components/vouchers/account-voucher-form"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function NewPaymentPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const formData = await getAccountVoucherFormData(company.id, "payment")

  return (
    <AccountVoucherForm
      companyId={company.id}
      voucherClass="payment"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      accounts={formData.accounts}
      cashBankAccounts={formData.cashBankAccounts}
      backHref={`/${company.slug}/banking`}
      title="New Payment"
      listHref={`/${company.slug}/banking`}
    />
  )
}
