import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"

export const Route = createFileRoute("/app/$companySlug/masters/items")({
  component: ItemsPage,
})

function ItemsPage() {
  const { companySlug } = Route.useParams()
  const { data, isLoading } = useQuery({
    queryKey: ["masters", companySlug, "items"],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companySlug}/masters/items`, { credentials: "include" })
      if (!res.ok) return { data: [] }
      return res.json()
    },
  })

  const rows = (data as { data?: { id: string; name: string; code: string; unit: string; salesRate: string; hsnCode: string; taxRate: string; status: string }[] })?.data ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[var(--sea-ink)]">Items</h2>
        <button className="rounded-lg bg-[var(--lagoon)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--lagoon-deep)]">
          Add Item
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--line)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--sea-ink-soft)]">Name</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--sea-ink-soft)]">Code</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--sea-ink-soft)]">Unit</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--sea-ink-soft)]">Sales Rate</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--sea-ink-soft)]">HSN Code</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--sea-ink-soft)]">Tax Rate</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--sea-ink-soft)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--sea-ink-soft)]">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--sea-ink-soft)]">No items found.</td></tr>
            ) : rows.map((row) => (
              <tr key={row.id} className="border-b border-[var(--line)] hover:bg-[var(--link-bg-hover)]">
                <td className="px-4 py-3 text-[var(--sea-ink)]">{row.name}</td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">{row.code}</td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">{row.unit}</td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">{row.salesRate}</td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">{row.hsnCode}</td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">{row.taxRate}</td>
                <td className="px-4 py-3 text-[var(--sea-ink-soft)]">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}