import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "#/lib/auth-context"

export const Route = createFileRoute("/app/")({
  component: CompanySelectionPage,
})

function CompanySelectionPage() {
  const { user, isAuthenticated } = useAuth()

  const { data: companies } = useQuery({
    queryKey: ["companies", "accessible"],
    queryFn: async () => {
      const res = await fetch("/api/companies/accessible", { credentials: "include" })
      if (!res.ok) return []
      return res.json()
    },
    enabled: isAuthenticated,
  })

  // Demo mode: show hardcoded company if not authenticated
  const isDemo = !isAuthenticated && !user

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">
          Select a Company
        </h1>
        {isDemo ? (
          <Link
            to="/app/acme-corp-ltd"
            className="island-shell rounded-xl px-6 py-4 text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5"
          >
            <div className="text-lg font-semibold">Acme Corp Ltd</div>
            <div className="text-sm text-[var(--sea-ink-soft)]">Demo Company</div>
          </Link>
        ) : (
          <div className="flex flex-col gap-3">
            {companies?.map((company: { id: string; slug: string; name: string; displayName: string }) => (
              <Link
                key={company.id}
                to="/app/$companySlug"
                params={{ companySlug: company.slug }}
                className="island-shell rounded-xl px-6 py-4 text-[var(--sea-ink)] no-underline transition hover:-translate-y-0.5"
              >
                <div className="text-lg font-semibold">{company.displayName || company.name}</div>
                <div className="text-sm text-[var(--sea-ink-soft)]">{company.slug}</div>
              </Link>
            ))}
            {(!companies || companies.length === 0) && (
              <p className="text-[var(--sea-ink-soft)]">No companies found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}