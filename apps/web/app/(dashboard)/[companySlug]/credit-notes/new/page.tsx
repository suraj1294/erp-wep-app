import { getVoucherFormData, type ItemVoucherFormPayload } from "@/lib/server-api"
import { ItemVoucherForm } from "@/components/vouchers/item-voucher-form"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function NewCreditNotePage({ params }: PageProps) {
  const { companySlug } = await params
  const formData = (await getVoucherFormData(
    companySlug,
    "credit_note"
  )) as ItemVoucherFormPayload

  return (
    <ItemVoucherForm
      companySlug={formData.companySlug}
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
