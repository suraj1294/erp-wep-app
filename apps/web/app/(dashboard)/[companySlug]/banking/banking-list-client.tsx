"use client"

import { useState } from "react"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@workspace/ui/components/tabs"
import { VoucherListTable, type VoucherRow } from "@/components/vouchers/voucher-list-table"

interface BankingListClientProps {
  companySlug: string
  payments: VoucherRow[]
  receipts: VoucherRow[]
  contras: VoucherRow[]
}

export function BankingListClient({
  companySlug,
  payments,
  receipts,
  contras,
}: BankingListClientProps) {
  const all = [...payments, ...receipts, ...contras].sort(
    (a, b) => b.voucherDate.localeCompare(a.voucherDate)
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Banking</h1>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({all.length})</TabsTrigger>
          <TabsTrigger value="payment">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="receipt">Receipts ({receipts.length})</TabsTrigger>
          <TabsTrigger value="contra">Contra ({contras.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <VoucherListTable
            title=""
            rows={all}
            newHref={`/${companySlug}/banking/payment/new`}
            newLabel="New Payment"
            basePath={`/${companySlug}/banking`}
            showType
          />
        </TabsContent>

        <TabsContent value="payment">
          <VoucherListTable
            title=""
            rows={payments}
            newHref={`/${companySlug}/banking/payment/new`}
            newLabel="New Payment"
            basePath={`/${companySlug}/banking`}
          />
        </TabsContent>

        <TabsContent value="receipt">
          <VoucherListTable
            title=""
            rows={receipts}
            newHref={`/${companySlug}/banking/receipt/new`}
            newLabel="New Receipt"
            basePath={`/${companySlug}/banking`}
          />
        </TabsContent>

        <TabsContent value="contra">
          <VoucherListTable
            title=""
            rows={contras}
            newHref={`/${companySlug}/banking/contra/new`}
            newLabel="New Contra"
            basePath={`/${companySlug}/banking`}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
