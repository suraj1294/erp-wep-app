import { listBankingVouchersForClass } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { BankingListClient } from "./banking-list-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function BankingPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const [payments, receipts, contras] = await Promise.all([
    listBankingVouchersForClass(company.id, "payment"),
    listBankingVouchersForClass(company.id, "receipt"),
    listBankingVouchersForClass(company.id, "contra"),
  ])

  return (
    <BankingListClient
      companySlug={company.slug}
      payments={payments}
      receipts={receipts}
      contras={contras}
    />
  )
}
