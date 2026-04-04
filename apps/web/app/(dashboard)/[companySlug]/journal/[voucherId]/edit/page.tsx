import { notFound } from "next/navigation"
import { AccountVoucherForm } from "@/components/vouchers/account-voucher-form"
import {
  getVoucherDetailData,
  getVoucherFormData,
  type AccountVoucherFormPayload,
} from "@/lib/server-api"
import { buildAccountVoucherInitialValues } from "@/lib/voucher-edit"

interface PageProps {
  params: Promise<{ companySlug: string; voucherId: string }>
}

export default async function EditJournalPage({ params }: PageProps) {
  const { companySlug, voucherId } = await params
  const [voucher, formData] = await Promise.all([
    getVoucherDetailData(companySlug, voucherId),
    getVoucherFormData(
      companySlug,
      "journal"
    ) as Promise<AccountVoucherFormPayload>,
  ])

  if (!voucher || voucher.voucherClass !== "journal") {
    notFound()
  }

  return (
    <AccountVoucherForm
      companySlug={formData.companySlug}
      voucherId={voucherId}
      formMode="edit"
      initialValues={buildAccountVoucherInitialValues(
        voucher,
        formData.cashBankAccounts
      )}
      voucherClass="journal"
      voucherTypes={formData.voucherTypes}
      parties={formData.parties}
      accounts={formData.accounts}
      cashBankAccounts={formData.cashBankAccounts}
      backHref={`/${companySlug}/journal/${voucherId}`}
      title="Edit Journal Entry"
      listHref={`/${companySlug}/journal/${voucherId}`}
    />
  )
}
