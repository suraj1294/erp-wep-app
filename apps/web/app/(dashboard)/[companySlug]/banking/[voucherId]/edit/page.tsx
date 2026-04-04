import { notFound } from "next/navigation"
import { AccountVoucherForm } from "@/components/vouchers/account-voucher-form"
import {
  getVoucherDetailData,
  getVoucherFormData,
  type AccountVoucherFormPayload,
} from "@/lib/server-api"
import {
  buildAccountVoucherInitialValues,
  getVoucherMeta,
} from "@/lib/voucher-edit"

interface PageProps {
  params: Promise<{ companySlug: string; voucherId: string }>
}

export default async function EditBankingVoucherPage({ params }: PageProps) {
  const { companySlug, voucherId } = await params
  const voucher = await getVoucherDetailData(companySlug, voucherId)

  if (
    !voucher ||
    !voucher.voucherClass ||
    !["payment", "receipt", "contra"].includes(voucher.voucherClass)
  ) {
    notFound()
  }

  const voucherClass = voucher.voucherClass as "payment" | "receipt" | "contra"
  const formData = (await getVoucherFormData(
    companySlug,
    voucherClass
  )) as AccountVoucherFormPayload
  const meta = getVoucherMeta(voucherClass)

  return (
    <AccountVoucherForm
      companySlug={formData.companySlug}
      voucherId={voucherId}
      formMode="edit"
      initialValues={buildAccountVoucherInitialValues(
        voucher,
        formData.cashBankAccounts
      )}
      voucherClass={voucherClass}
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      accounts={formData.accounts}
      cashBankAccounts={formData.cashBankAccounts}
      backHref={`/${companySlug}/banking/${voucherId}`}
      title={meta.editTitle}
      listHref={`/${companySlug}/banking/${voucherId}`}
    />
  )
}
