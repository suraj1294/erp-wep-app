import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/app/$companySlug/")({
  component: Dashboard,
});

function Dashboard() {
  const { companySlug } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.company(companySlug).dashboard(),
    queryFn: () => api.getDashboard(companySlug),
  });

  const companyName = companySlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          Unable to load dashboard data.{" "}
          <span className="text-red-500">({error.message})</span>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  const summary = data?.summary ?? { accountsCount: 0, partiesCount: 0, itemsCount: 0, vouchersCount: 0 };
  const recent = data?.recentTransactions ?? [];
  const mix = data?.voucherMix ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-br from-teal-700 to-teal-900 p-6 text-white shadow-lg">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-teal-200">Live dashboard</p>
        <h1 className="text-2xl font-bold">{companyName}</h1>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard label="Posted vouchers" value={compact.format(summary.vouchersCount)} hint={`${summary.accountsCount} accounts`} />
          <MetricCard label="Parties" value={compact.format(summary.partiesCount)} hint={`${summary.itemsCount} items`} />
          <MetricCard label="Accounts" value={compact.format(summary.accountsCount)} hint={`${summary.vouchersCount} vouchers`} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title="Accounts" count={summary.accountsCount} href={`/app/${companySlug}/masters/accounts`} />
        <StatCard title="Parties" count={summary.partiesCount} href={`/app/${companySlug}/masters/parties`} />
        <StatCard title="Items" count={summary.itemsCount} href={`/app/${companySlug}/masters/items`} />
        <StatCard title="Voucher Types" count={summary.vouchersCount} href={`/app/${companySlug}/masters/voucher-types`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Voucher Mix</h2>
          {mix.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-500">No voucher data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mix.map((item) => {
                const maxCount = Math.max(...mix.map((m) => m.count), 1);
                const pct = (item.count / maxCount) * 100;
                return (
                  <div key={item.voucherClass} className="rounded-lg border bg-white p-3">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{item.label}</span>
                      <span className="text-gray-500">{item.count} entries</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{inr.format(parseFloat(item.totalAmount))}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Recent Transactions</h2>
          {recent.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{txn.voucherNumber}</span>
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">{txn.voucherClassLabel}</span>
                      <StatusBadge status={txn.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {txn.partyName ?? "No party"} &middot; {formatDate(txn.voucherDate)}
                    </p>
                  </div>
                  <span className="ml-3 font-medium text-gray-900 text-sm whitespace-nowrap">
                    {inr.format(parseFloat(txn.totalAmount))}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction label="Add Party" href={`/app/${companySlug}/masters/parties`} />
              <QuickAction label="Add Item" href={`/app/${companySlug}/masters/items`} />
              <QuickAction label="Add Account" href={`/app/${companySlug}/masters/accounts`} />
              <QuickAction label="Voucher Types" href={`/app/${companySlug}/masters/voucher-types`} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-teal-200">{label}</p>
      <p className="text-xs text-teal-300/60">{hint}</p>
    </div>
  );
}

function StatCard({ title, count, href }: { title: string; count: number; href: string }) {
  return (
    <a href={href} aria-label="Open metric" className="rounded-lg border bg-white p-4 no-underline shadow-sm transition hover:border-teal-300 hover:shadow-md">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{title}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{count}</p>
    </a>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    draft: "bg-yellow-50 text-yellow-700",
    cancelled: "bg-red-50 text-red-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-50 text-gray-700"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function QuickAction({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} aria-label="Open quick action" className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 no-underline transition hover:border-teal-300 hover:text-teal-700">
      + {label}
    </a>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 opacity-50">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-4">
            <div className="h-3 w-16 rounded bg-gray-200" />
            <div className="mt-2 h-6 w-8 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
