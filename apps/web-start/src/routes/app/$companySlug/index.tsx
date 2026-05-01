import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/app/$companySlug/")({
  component: DashboardPage,
})

function DashboardPage() {
  const { companySlug } = Route.useParams()

  return (
    <div>
      <p className="text-[var(--sea-ink-soft)]">
        Welcome to {companySlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
      </p>
    </div>
  )
}