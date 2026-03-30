import { notFound } from "next/navigation"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import { getVoucherDetail } from "@/app/(dashboard)/[companySlug]/vouchers/actions"

interface PageProps {
  params: Promise<{ companySlug: string; voucherId: string }>
}

export default async function BankingVoucherPage({ params }: PageProps) {
  const { companySlug, voucherId } = await params
  const voucher = await getVoucherDetail(companySlug, voucherId)
  if (!voucher) notFound()

  const isCancelled = voucher.status === "cancelled"
  const totalDebit = voucher.lineItems.reduce(
    (s, li) => s + parseFloat(li.debitAmount ?? "0"),
    0
  )
  const totalCredit = voucher.lineItems.reduce(
    (s, li) => s + parseFloat(li.creditAmount ?? "0"),
    0
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/${companySlug}/banking`}>
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
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-3">
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
                <th className="px-3 py-2 text-left font-medium">Description</th>
                <th className="px-3 py-2 text-right font-medium">Debit</th>
                <th className="px-3 py-2 text-right font-medium">Credit</th>
              </tr>
            </thead>
            <tbody>
              {voucher.lineItems.map((li) => (
                <tr key={li.id} className="border-t">
                  <td className="px-3 py-2">{li.lineNumber}</td>
                  <td className="px-3 py-2">{li.accountName ?? "—"}</td>
                  <td className="px-3 py-2">{li.description ?? "—"}</td>
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
            <tfoot className="bg-muted/30">
              <tr className="border-t font-semibold">
                <td colSpan={3} className="px-3 py-2 text-right">Total</td>
                <td className="px-3 py-2 text-right font-mono">
                  ₹ {totalDebit.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  ₹ {totalCredit.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
