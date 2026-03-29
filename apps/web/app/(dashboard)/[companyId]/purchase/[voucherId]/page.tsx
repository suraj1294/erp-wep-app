import { notFound } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import { getVoucherDetail } from "@/app/(dashboard)/[companyId]/vouchers/actions"

interface PageProps {
  params: Promise<{ companyId: string; voucherId: string }>
}

export default async function PurchaseVoucherPage({ params }: PageProps) {
  const { companyId, voucherId } = await params
  const voucher = await getVoucherDetail(companyId, voucherId)

  if (!voucher) notFound()

  const isCancelled = voucher.status === "cancelled"

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/${companyId}/purchase`}>
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{voucher.voucherNumber}</h1>
            <p className="text-xs text-muted-foreground">
              {voucher.voucherTypeName} · {voucher.voucherDate}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCancelled ? (
            <Badge variant="destructive">Cancelled</Badge>
          ) : (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Active
            </Badge>
          )}
          {!isCancelled && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${companyId}/purchase/${voucherId}/edit`}>Edit</Link>
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Date</p>
          <p>{voucher.voucherDate}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Party</p>
          <p>{voucher.partyName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Reference #</p>
          <p>{voucher.referenceNumber ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">Due Date</p>
          <p>{voucher.dueDate ?? "—"}</p>
        </div>
        {voucher.narration && (
          <div className="col-span-full">
            <p className="text-xs font-medium text-muted-foreground">Narration</p>
            <p>{voucher.narration}</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium">Ledger Entries</h2>
        <div className="rounded-md border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="px-3 py-2 text-left font-medium">Account</th>
                <th className="px-3 py-2 text-left font-medium">Item</th>
                <th className="px-3 py-2 text-left font-medium">Description</th>
                <th className="px-3 py-2 text-right font-medium">Qty</th>
                <th className="px-3 py-2 text-right font-medium">Rate</th>
                <th className="px-3 py-2 text-right font-medium">Debit</th>
                <th className="px-3 py-2 text-right font-medium">Credit</th>
              </tr>
            </thead>
            <tbody>
              {voucher.lineItems.map((li) => (
                <tr key={li.id} className="border-t">
                  <td className="px-3 py-2">{li.lineNumber}</td>
                  <td className="px-3 py-2">{li.accountName ?? "—"}</td>
                  <td className="px-3 py-2">{li.itemName ?? "—"}</td>
                  <td className="px-3 py-2">{li.description ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">{li.quantity ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {li.rate ? `₹ ${parseFloat(li.rate).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {parseFloat(li.debitAmount ?? "0") > 0
                      ? `₹ ${parseFloat(li.debitAmount!).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {parseFloat(li.creditAmount ?? "0") > 0
                      ? `₹ ${parseFloat(li.creditAmount!).toFixed(2)}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="rounded-lg border bg-muted/30 px-6 py-3 text-sm">
          <span className="text-muted-foreground">Total Amount: </span>
          <span className="font-semibold font-mono">
            ₹ {parseFloat(voucher.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  )
}
