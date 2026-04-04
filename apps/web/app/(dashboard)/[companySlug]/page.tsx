import Link from "next/link"
import { getCompanyDashboardData } from "@/lib/server-api"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

const compactCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
})

const compactNumberFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

export default async function CompanyDashboardPage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const {
    company,
    membership,
    summary,
    recentTransactions,
    voucherMix,
    monthlyActivity,
  } = await getCompanyDashboardData(companySlug)

  const monthlyMaxAmount = Math.max(
    ...monthlyActivity.map((entry) => Number(entry.totalAmount)),
    1
  )
  const totalMixCount = Math.max(
    voucherMix.reduce((sum, item) => sum + item.count, 0),
    1
  )

  const quickActions = [
    {
      title: "New Sales Invoice",
      description: "Create a fresh customer invoice and post it right away.",
      href: `/${company.slug}/sales/new`,
    },
    {
      title: "Record Purchase",
      description: "Capture supplier bills and update stock valuation.",
      href: `/${company.slug}/purchase/new`,
    },
    {
      title: "Receive Payment",
      description: "Post receipts directly into your bank or cash account.",
      href: `/${company.slug}/banking/receipt/new`,
    },
    {
      title: "Add Party",
      description: "Set up a customer or supplier master before transacting.",
      href: `/${company.slug}/masters/parties`,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.7fr_1fr]">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="border-white/15 bg-white/10 text-white"
            >
              Live dashboard
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                {company.displayName || company.name}
              </h1>
              <p className="max-w-2xl text-sm text-white/75">
                Keep a close eye on transaction flow, company setup progress,
                and what your team should do next.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <HeroMetric
                label="Posted vouchers"
                value={compactNumber(summary.vouchersCount)}
                hint={`${summary.accountsCount} accounts ready`}
              />
              <HeroMetric
                label="Sales this month"
                value={formatCurrency(summary.salesThisMonth)}
                hint={`${summary.partiesCount} active parties`}
              />
              <HeroMetric
                label="Cash and bank"
                value={formatCurrency(summary.cashBankBalance)}
                hint={`${summary.itemsCount} active items`}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Operator snapshot</p>
                <p className="text-xs text-white/65">
                  Your access and operational focus for this company.
                </p>
              </div>
              <Badge className="bg-white text-slate-900">
                {membership.role}
              </Badge>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <InsightRow
                label="Purchases this month"
                value={formatCurrency(summary.purchasesThisMonth)}
              />
              <InsightRow
                label="Low stock items"
                value={`${summary.lowStockItemsCount}`}
                emphasize={summary.lowStockItemsCount > 0}
              />
              <InsightRow
                label="Recent activity"
                value={
                  recentTransactions.length > 0
                    ? `${recentTransactions.length} latest entries`
                    : "No vouchers yet"
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard
          title="Accounts"
          value={compactNumber(summary.accountsCount)}
          description="Chart of accounts that can be used in vouchers and reports."
          href={`/${company.slug}/accounts`}
          actionLabel="Open accounts"
        />
        <DashboardStatCard
          title="Parties"
          value={compactNumber(summary.partiesCount)}
          description="Customers and suppliers currently active for transactions."
          href={`/${company.slug}/masters/parties`}
          actionLabel="Manage parties"
        />
        <DashboardStatCard
          title="Items"
          value={compactNumber(summary.itemsCount)}
          description="Stock and service masters available for billing and purchase."
          href={`/${company.slug}/masters/items`}
          actionLabel="View items"
        />
        <DashboardStatCard
          title="Vouchers"
          value={compactNumber(summary.vouchersCount)}
          description="Posted documents across sales, purchase, banking, and journal."
          href={`/${company.slug}/sales`}
          actionLabel="Open transactions"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <Card className="min-h-[22rem]">
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
            <CardDescription>
              Total voucher value posted over the last six months.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex h-full flex-col justify-between gap-5">
            <div className="grid min-h-56 grid-cols-6 items-end gap-3">
              {monthlyActivity.map((entry) => {
                const ratio = Number(entry.totalAmount) / monthlyMaxAmount
                const height = `${Math.max(ratio * 100, entry.count > 0 ? 10 : 3)}%`

                return (
                  <div key={entry.monthKey} className="flex h-full flex-col items-center gap-3">
                    <div className="flex h-40 w-full items-end justify-center rounded-xl bg-muted/40 px-2 py-2">
                      <div
                        className="w-full rounded-md bg-gradient-to-t from-teal-600 via-cyan-500 to-sky-300 shadow-[0_6px_18px_rgba(8,145,178,0.3)]"
                        style={{ height }}
                      />
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-xs font-medium">{entry.monthLabel}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {compactCurrency(entry.totalAmount)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {entry.count} txn
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground">
              This trend is based on voucher totals and helps surface whether
              activity is building up month over month.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voucher Mix</CardTitle>
            <CardDescription>
              Which transaction types are driving most of the current activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {voucherMix.length === 0 ? (
              <EmptyState
                title="No transaction mix yet"
                description="Post your first voucher to start seeing operational distribution here."
                href={`/${company.slug}/sales/new`}
                actionLabel="Create first voucher"
              />
            ) : (
              voucherMix.map((item) => {
                const share = (item.count / totalMixCount) * 100

                return (
                  <div key={item.voucherClass} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.count} entries
                        </p>
                      </div>
                      <p className="text-xs font-medium text-foreground/80">
                        {formatCurrency(item.totalAmount)}
                      </p>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500"
                        style={{ width: `${Math.max(share, 8)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Latest posted vouchers across all transaction modules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.length === 0 ? (
              <EmptyState
                title="No recent transactions"
                description="Start with a sales invoice, purchase entry, or banking receipt to populate the dashboard."
                href={`/${company.slug}/sales/new`}
                actionLabel="Create invoice"
              />
            ) : (
              recentTransactions.map((transaction) => (
                <Link
                  key={transaction.id}
                  href={transaction.href}
                  className="flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">
                        {transaction.voucherNumber}
                      </p>
                      <Badge variant="outline">
                        {transaction.voucherTypeName || transaction.voucherClassLabel}
                      </Badge>
                      <StatusBadge status={transaction.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {transaction.partyName || "No party linked"} •{" "}
                      {formatDate(transaction.voucherDate)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold">
                      {formatCurrency(transaction.totalAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.voucherClassLabel}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Jump into the most common work without hunting through menus.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <div
                key={action.href}
                className="rounded-xl border border-dashed p-4"
              >
                <p className="text-sm font-medium">{action.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {action.description}
                </p>
                <Button className="mt-3" size="sm" asChild>
                  <Link href={action.href}>Open</Link>
                </Button>
              </div>
            ))}
            <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground">
              {summary.lowStockItemsCount > 0
                ? `${summary.lowStockItemsCount} items are at or below reorder level. Review inventory planning soon.`
                : "Inventory is not currently showing any low-stock alerts based on reorder levels."}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function DashboardStatCard({
  title,
  value,
  description,
  href,
  actionLabel,
}: {
  title: string
  value: string
  description: string
  href: string
  actionLabel: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        <Button variant="outline" size="sm" asChild>
          <Link href={href}>{actionLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function HeroMetric({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-white/55">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-white/60">{hint}</p>
    </div>
  )
}

function InsightRow({
  label,
  value,
  emphasize = false,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2">
      <span className="text-white/70">{label}</span>
      <span className={emphasize ? "font-semibold text-amber-200" : "font-medium"}>
        {value}
      </span>
    </div>
  )
}

function EmptyState({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string
  description: string
  href: string
  actionLabel: string
}) {
  return (
    <div className="rounded-xl border border-dashed p-5 text-sm">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-muted-foreground">{description}</p>
      <Button className="mt-3" size="sm" asChild>
        <Link href={href}>{actionLabel}</Link>
      </Button>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "cancelled") {
    return <Badge variant="destructive">Cancelled</Badge>
  }

  if (status === "draft") {
    return <Badge variant="secondary">Draft</Badge>
  }

  return <Badge variant="outline">Active</Badge>
}

function formatCurrency(value: string) {
  return currencyFormatter.format(Number(value || 0))
}

function compactCurrency(value: string) {
  return `₹${compactCurrencyFormatter.format(Number(value || 0))}`
}

function compactNumber(value: number) {
  return compactNumberFormatter.format(value)
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}
