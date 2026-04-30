import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/$companySlug/masters")({
  component: MastersLayout,
});

function MastersLayout() {
  return <Outlet />;
}