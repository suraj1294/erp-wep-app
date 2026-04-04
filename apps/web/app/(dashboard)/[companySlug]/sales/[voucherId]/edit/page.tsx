import { notFound } from "next/navigation"
import { ItemVoucherForm } from "@/components/vouchers/item-voucher-form"
import {
  getVoucherDetailData,
  getVoucherFormData,
  type ItemVoucherFormPayload,
} from "@/lib/server-api"
import { buildItemVoucherInitialValues } from "@/lib/voucher-edit"

interface PageProps {
  params: Promise<{ companySlug: string; voucherId: string }>
}

export default async function EditSalesPage({ params }: PageProps) {
  const { companySlug, voucherId } = await params
  const [voucher, formData] = await Promise.all([
    getVoucherDetailData(companySlug, voucherId),
    getVoucherFormData(companySlug, "sales") as Promise<ItemVoucherFormPayload>,
  ])

  if (!voucher || voucher.voucherClass !== "sales") {
    notFound()
  }

  return (
    <ItemVoucherForm
      companySlug={formData.companySlug}
      voucherId={voucherId}
      mode="edit"
      initialValues={buildItemVoucherInitialValues(voucher, formData.items)}
      voucherClass="sales"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      items={formData.items}
      accounts={formData.accounts}
      backHref={`/${companySlug}/sales/${voucherId}`}
      title="Edit Sales Invoice"
      listHref={`/${companySlug}/sales/${voucherId}`}
    />
  )
}
