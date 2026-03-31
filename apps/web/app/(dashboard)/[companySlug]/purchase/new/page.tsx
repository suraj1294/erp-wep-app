import { getItemVoucherFormData } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { ItemVoucherForm } from "@/components/vouchers/item-voucher-form"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function NewPurchasePage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const formData = await getItemVoucherFormData(company.id, "purchase")

  return (
    <ItemVoucherForm
      companyId={company.id}
      voucherClass="purchase"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      items={formData.items}
      accounts={formData.accounts}
      backHref={`/${company.slug}/purchase`}
      title="New Purchase Bill"
      listHref={`/${company.slug}/purchase`}
    />
  )
}
