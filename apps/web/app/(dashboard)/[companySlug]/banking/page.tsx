import { getBankingData } from "@/lib/server-api"
import { BankingListClient } from "./banking-list-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function BankingPage({ params }: PageProps) {
  const { companySlug } = await params
  const { payments, receipts, contras, companySlug: resolvedCompanySlug } =
    await getBankingData(companySlug)

  return (
    <BankingListClient
      companySlug={resolvedCompanySlug}
      payments={payments}
      receipts={receipts}
      contras={contras}
    />
  )
}
