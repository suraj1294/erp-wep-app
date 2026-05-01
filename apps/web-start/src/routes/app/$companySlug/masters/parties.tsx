import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"

export const Route = createFileRoute("/app/$companySlug/masters/parties")({
  component: PartiesPage,
})

function PartiesPage() {
  const { companySlug } = Route.useParams()
  const { data, isLoading } = useQuery({
    queryKey: ["masters", companySlug, "parties"],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companySlug}/masters/parties`, { credentials: "include" })
      if (!res.ok) return { data: [] }
      return res.json()
    },
  })

  const rows = (data as { data?: { id: string; name: string; type: string; phone: string; email: string; gstin: string; status: string }[] })?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[var(--sea-ink)]">Parties</h2>
        <button className="rounded-lg bg-[var(--lagoon)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--lagoon-deep)]">
          Add Party
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--line)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--sea-ink-soft)]">Name</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--sea-ink-soft)]">Type</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--sea-ink-soft)]">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--sea-ink-soft)]">Email</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--sea-ink-soft)]">GSTIN</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--sea-ink-soft)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--sea-ink-soft)]">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[var(--sea-ink-soft)]">No parties found.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--line)] hover:bg-[var(--link-bg-hover)]">
                <td className="px-4 py-3 text-[var(--sea-ink)]">{row.name}</td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">{row.type}</td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">{row.phone}</td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">{row.email}</td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">{row.gstin}</td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}