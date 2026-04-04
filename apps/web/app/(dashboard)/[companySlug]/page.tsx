import { getCompanyDashboardData } from "@/lib/server-api"

export default async function CompanyDashboardPage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const { membership } = await getCompanyDashboardData(companySlug)

  return (
    <div>
      <h1 className="text-2xl font-bold">Company Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome! Your role is <span className="capitalize font-medium">{membership.role}</span>.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title="Accounts" value="--" />
        <DashboardCard title="Vouchers" value="--" />
        <DashboardCard title="Parties" value="--" />
        <DashboardCard title="Items" value="--" />
      </div>
    </div>
  )
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  )
}
