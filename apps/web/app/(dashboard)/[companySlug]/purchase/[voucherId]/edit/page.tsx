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

export default async function EditPurchasePage({ params }: PageProps) {
  const { companySlug, voucherId } = await params
  const [voucher, formData] = await Promise.all([
    getVoucherDetailData(companySlug, voucherId),
    getVoucherFormData(
      companySlug,
      "purchase"
    ) as Promise<ItemVoucherFormPayload>,
  ])

  if (!voucher || voucher.voucherClass !== "purchase") {
    notFound()
  }

  return (
    <ItemVoucherForm
      companySlug={formData.companySlug}
      voucherId={voucherId}
      mode="edit"
      initialValues={buildItemVoucherInitialValues(voucher, formData.items)}
      voucherClass="purchase"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      items={formData.items}
      accounts={formData.accounts}
      backHref={`/${companySlug}/purchase/${voucherId}`}
      title="Edit Purchase Bill"
      listHref={`/${companySlug}/purchase/${voucherId}`}
    />
  )
}
