import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import { useAuth } from "#/lib/auth-context"

export const Route = createFileRoute("/app/$companySlug")({
  component: CompanyDashboardPage,
})

function CompanyDashboardPage() {
  const { signOut } = useAuth()
  const { companySlug } = Route.useParams()

  const masterLinks = [
    { label: "Account Groups", to: "/app/$companySlug/masters/account-groups" as const },
    { label: "Accounts", to: "/app/$companySlug/masters/accounts" as const },
    { label: "Voucher Types", to: "/app/$companySlug/masters/voucher-types" as const },
    { label: "Parties", to: "/app/$companySlug/masters/parties" as const },
    { label: "Items", to: "/app/$companySlug/masters/items" as const },
    { label: "Units of Measure", to: "/app/$companySlug/masters/units" as const },
  ]

  return (
    <div className="flex min-h-svh">
      <aside className="w-64 border-r border-[var(--line)] bg-[var(--surface-strong)]">
        <div className="p-4">
          <h2 className="text-lg font-bold text-[var(--sea-ink)]">Tally ERP</h2>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          <Link
            to="/app/$companySlug"
            params={{ companySlug }}
            className="rounded-md px-3 py-2 text-sm text-[var(--sea-ink-soft)] no-underline transition hover:bg-[var(--link-bg-hover)]"
          >
            Dashboard
          </Link>
          <div>
            <button className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)]">
              Masters
            </button>
            <div className="ml-3 flex flex-col gap-1">
              {masterLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  params={{ companySlug }}
                  className="rounded-md px-3 py-1.5 text-sm text-[var(--sea-ink-soft)] no-underline transition hover:bg-[var(--link-bg-hover)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </aside>
      <main className="flex-1">
        <header className="border-b border-[var(--line)] bg-[var(--header-bg)] px-6 py-4">
          <h1 className="text-xl font-semibold text-[var(--sea-ink)]">Dashboard</h1>
          <span className="text-sm text-[var(--sea-ink-soft)]">{companySlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
      <button
        onClick={signOut}
        className="fixed bottom-4 right-4 rounded-lg border border-[var(--line)] bg-white/50 px-4 py-2 text-sm text-[var(--sea-ink)] transition hover:bg-[var(--link-bg-hover)]"
      >
        Sign out
      </button>
    </div>
  )
}