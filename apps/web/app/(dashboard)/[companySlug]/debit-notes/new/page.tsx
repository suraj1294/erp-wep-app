import { getItemVoucherFormData } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { ItemVoucherForm } from "@/components/vouchers/item-voucher-form"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function NewDebitNotePage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const formData = await getItemVoucherFormData(company.id, "debit_note")

  return (
    <ItemVoucherForm
      companyId={company.id}
      voucherClass="debit_note"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      items={formData.items}
      accounts={formData.accounts}
      backHref={`/${company.slug}/debit-notes`}
      title="New Debit Note"
      listHref={`/${company.slug}/debit-notes`}
    />
  )
}
