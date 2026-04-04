import { getVoucherFormData, type ItemVoucherFormPayload } from "@/lib/server-api"
import { ItemVoucherForm } from "@/components/vouchers/item-voucher-form"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function NewDebitNotePage({ params }: PageProps) {
  const { companySlug } = await params
  const formData = (await getVoucherFormData(
    companySlug,
    "debit_note"
  )) as ItemVoucherFormPayload

  return (
    <ItemVoucherForm
      companySlug={formData.companySlug}
      voucherClass="debit_note"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      items={formData.items}
      accounts={formData.accounts}
      backHref={`/${formData.companySlug}/debit-notes`}
      title="New Debit Note"
      listHref={`/${formData.companySlug}/debit-notes`}
    />
  )
}
