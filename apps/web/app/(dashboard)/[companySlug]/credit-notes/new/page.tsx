import { getVoucherFormData } from "@/lib/server-api"
import { ItemVoucherForm } from "@/components/vouchers/item-voucher-form"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function NewCreditNotePage({ params }: PageProps) {
  const { companySlug } = await params
  const formData = await getVoucherFormData(companySlug, "credit_note")

  return (
    <ItemVoucherForm
      companyId={formData.companyId}
      voucherClass="credit_note"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      items={formData.items}
      accounts={formData.accounts}
      backHref={`/${formData.companySlug}/credit-notes`}
      title="New Credit Note"
      listHref={`/${formData.companySlug}/credit-notes`}
    />
  )
}
