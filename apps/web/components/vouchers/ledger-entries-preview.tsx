"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

export interface LedgerEntry {
  accountName: string
  debit: number
  credit: number
}

interface LedgerEntriesPreviewProps {
  entries: LedgerEntry[]
  currencySymbol?: string
}

function fmt(n: number, symbol: string) {
  if (n === 0) return "—"
  return `${symbol} ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function LedgerEntriesPreview({
  entries,
  currencySymbol = "₹",
}: LedgerEntriesPreviewProps) {
  const [open, setOpen] = useState(false)

  const totalDebit = entries.reduce((s, e) => s + e.debit, 0)
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0)
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005

  if (entries.length === 0) return null

  return (
    <div className="rounded-lg border">
      <Button
        variant="ghost"
        className="w-full justify-between rounded-lg px-4 py-2.5 text-xs font-medium"
        onClick={() => setOpen((v) => !v)}
      >
        <span>View Ledger Entries</span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className={cn("size-3 transition-transform", open && "rotate-180")}
        />
      </Button>

      {open && (
        <>
          <Separator />
          <div className="overflow-x-auto p-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="py-1 text-left font-medium">Account</th>
                  <th className="py-1 text-right font-medium">Debit</th>
                  <th className="py-1 text-right font-medium">Credit</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i} className="border-t border-border/50">
                    <td className="py-1">{e.accountName}</td>
                    <td className="py-1 text-right font-mono">
                      {fmt(e.debit, currencySymbol)}
                    </td>
                    <td className="py-1 text-right font-mono">
                      {fmt(e.credit, currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold">
                  <td className="py-1">Total</td>
                  <td className="py-1 text-right font-mono">
                    {fmt(totalDebit, currencySymbol)}
                  </td>
                  <td className="py-1 text-right font-mono">
                    {fmt(totalCredit, currencySymbol)}
                  </td>
                </tr>
              </tfoot>
            </table>
            {!balanced && (
              <p className="mt-1 text-[10px] text-destructive">
                Unbalanced: difference of{" "}
                {fmt(Math.abs(totalDebit - totalCredit), currencySymbol)}
              </p>
            )}
            {balanced && entries.length >= 2 && (
              <p className="mt-1 text-[10px] text-green-600">✓ Balanced</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** Build ledger entries preview for item-based vouchers */
export function buildItemLedgerPreview(params: {
  voucherClass: string
  partyName: string | null
  lines: Array<{
    itemName?: string
    quantity: number
    rate: number
    taxRate: number
  }>
  salesAccountName?: string
  purchaseAccountName?: string
  gstOutputName?: string
  gstInputName?: string
}): LedgerEntry[] {
  const {
    voucherClass,
    partyName,
    lines,
    salesAccountName = "Sales",
    purchaseAccountName = "Purchase",
    gstOutputName = "GST Output",
    gstInputName = "GST Input Credit",
  } = params

  const isSales = voucherClass === "sales" || voucherClass === "credit_note"
  const entries: LedgerEntry[] = []

  let subtotal = 0
  const taxMap: Record<number, number> = {}

  for (const line of lines) {
    const amt = (line.quantity || 0) * (line.rate || 0)
    subtotal += amt
    const tax = (amt * (line.taxRate || 0)) / 100
    if (line.taxRate > 0) {
      taxMap[line.taxRate] = (taxMap[line.taxRate] ?? 0) + tax
    }
  }

  const totalTax = Object.values(taxMap).reduce((s, v) => s + v, 0)
  const grandTotal = subtotal + totalTax

  if (isSales) {
    // Dr Party  Cr Sales  Cr GST Output
    if (partyName) {
      entries.push({
        accountName: `${partyName} (Sundry Debtors)`,
        debit: grandTotal,
        credit: 0,
      })
    }
    entries.push({ accountName: salesAccountName, debit: 0, credit: subtotal })
    for (const [rate, amt] of Object.entries(taxMap)) {
      entries.push({
        accountName: `${gstOutputName} @ ${rate}%`,
        debit: 0,
        credit: amt,
      })
    }
  } else {
    // Dr Purchase  Dr GST Input  Cr Party
    entries.push({
      accountName: purchaseAccountName,
      debit: subtotal,
      credit: 0,
    })
    for (const [rate, amt] of Object.entries(taxMap)) {
      entries.push({
        accountName: `${gstInputName} @ ${rate}%`,
        debit: amt,
        credit: 0,
      })
    }
    if (partyName) {
      entries.push({
        accountName: `${partyName} (Sundry Creditors)`,
        debit: 0,
        credit: grandTotal,
      })
    }
  }

  return entries
}
