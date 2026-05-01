import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/app/$companySlug/masters/")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/app/$companySlug/masters/account-groups", params: { companySlug: params.companySlug } })
  },
})