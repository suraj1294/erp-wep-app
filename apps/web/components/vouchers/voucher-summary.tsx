import { cn } from "@workspace/ui/lib/utils"
import { Separator } from "@workspace/ui/components/separator"

interface TaxGroup {
  rate: number
  amount: number
}

interface VoucherSummaryProps {
  subtotal: number
  taxGroups?: TaxGroup[]
  total: number
  /** "₹" by default */
  currencySymbol?: string
  /** Show subtotal + tax breakdown rows (item-based) or just total (account-based) */
  showTaxBreakdown?: boolean
  className?: string
}

function fmt(n: number, symbol: string) {
  return `${symbol} ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function VoucherSummary({
  subtotal,
  taxGroups = [],
  total,
  currencySymbol = "₹",
  showTaxBreakdown = true,
  className,
}: VoucherSummaryProps) {
  return (
    <div className={cn("flex justify-end", className)}>
      <div className="w-72 rounded-lg border bg-muted/30 p-4">
        <dl className="flex flex-col gap-1.5 text-xs">
          {showTaxBreakdown && (
            <>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-mono">{fmt(subtotal, currencySymbol)}</dd>
              </div>
              {taxGroups.map((tg) => (
                <div key={tg.rate} className="flex justify-between">
                  <dt className="text-muted-foreground">GST @ {tg.rate}%</dt>
                  <dd className="font-mono">{fmt(tg.amount, currencySymbol)}</dd>
                </div>
              ))}
              <Separator className="my-1" />
            </>
          )}
          <div className="flex justify-between text-sm font-semibold">
            <dt>Total</dt>
            <dd className="font-mono">{fmt(total, currencySymbol)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

/** Compute subtotal, tax groups, and grand total from item lines */
export function computeSummary(
  lines: Array<{ quantity: number; rate: number; taxRate: number }>
): { subtotal: number; taxGroups: TaxGroup[]; grandTotal: number } {
  let subtotal = 0
  const taxMap: Record<number, number> = {}

  for (const line of lines) {
    const lineAmt = (line.quantity || 0) * (line.rate || 0)
    subtotal += lineAmt
    const tax = (lineAmt * (line.taxRate || 0)) / 100
    if (line.taxRate > 0) {
      taxMap[line.taxRate] = (taxMap[line.taxRate] ?? 0) + tax
    }
  }

  const taxGroups = Object.entries(taxMap).map(([rate, amount]) => ({
    rate: Number(rate),
    amount,
  }))
  const totalTax = taxGroups.reduce((s, g) => s + g.amount, 0)

  return { subtotal, taxGroups, grandTotal: subtotal + totalTax }
}
