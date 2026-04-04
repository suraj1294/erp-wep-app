import { getVoucherFormData, type ItemVoucherFormPayload } from "@/lib/server-api"
import { ItemVoucherForm } from "@/components/vouchers/item-voucher-form"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function NewSalesPage({ params }: PageProps) {
  const { companySlug } = await params
  const formData = (await getVoucherFormData(
    companySlug,
    "sales"
  )) as ItemVoucherFormPayload

  return (
    <ItemVoucherForm
      companySlug={formData.companySlug}
      voucherClass="sales"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      items={formData.items}
      accounts={formData.accounts}
      backHref={`/${formData.companySlug}/sales`}
      title="New Sales Invoice"
      listHref={`/${formData.companySlug}/sales`}
    />
  )
}
