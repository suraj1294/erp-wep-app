import { getVoucherFormData, type ItemVoucherFormPayload } from "@/lib/server-api"
import { ItemVoucherForm } from "@/components/vouchers/item-voucher-form"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function NewPurchasePage({ params }: PageProps) {
  const { companySlug } = await params
  const formData = (await getVoucherFormData(
    companySlug,
    "purchase"
  )) as ItemVoucherFormPayload

  return (
    <ItemVoucherForm
      companySlug={formData.companySlug}
      voucherClass="purchase"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      items={formData.items}
      accounts={formData.accounts}
      backHref={`/${formData.companySlug}/purchase`}
      title="New Purchase Bill"
      listHref={`/${formData.companySlug}/purchase`}
    />
  )
}
