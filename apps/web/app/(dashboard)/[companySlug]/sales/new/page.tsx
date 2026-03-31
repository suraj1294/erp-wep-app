import { getItemVoucherFormData } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { ItemVoucherForm } from "@/components/vouchers/item-voucher-form"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function NewSalesPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const formData = await getItemVoucherFormData(company.id, "sales")

  return (
    <ItemVoucherForm
      companyId={company.id}
      voucherClass="sales"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      items={formData.items}
      accounts={formData.accounts}
      backHref={`/${company.slug}/sales`}
      title="New Sales Invoice"
      listHref={`/${company.slug}/sales`}
    />
  )
}
