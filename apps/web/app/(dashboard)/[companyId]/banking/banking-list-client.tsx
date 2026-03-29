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
  companyId: string
  payments: VoucherRow[]
  receipts: VoucherRow[]
  contras: VoucherRow[]
}

export function BankingListClient({
  companyId,
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
            newHref={`/${companyId}/banking/payment/new`}
            newLabel="New Payment"
            basePath={`/${companyId}/banking`}
            showType
          />
        </TabsContent>

        <TabsContent value="payment">
          <VoucherListTable
            title=""
            rows={payments}
            newHref={`/${companyId}/banking/payment/new`}
            newLabel="New Payment"
            basePath={`/${companyId}/banking`}
          />
        </TabsContent>

        <TabsContent value="receipt">
          <VoucherListTable
            title=""
            rows={receipts}
            newHref={`/${companyId}/banking/receipt/new`}
            newLabel="New Receipt"
            basePath={`/${companyId}/banking`}
          />
        </TabsContent>

        <TabsContent value="contra">
          <VoucherListTable
            title=""
            rows={contras}
            newHref={`/${companyId}/banking/contra/new`}
            newLabel="New Contra"
            basePath={`/${companyId}/banking`}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
