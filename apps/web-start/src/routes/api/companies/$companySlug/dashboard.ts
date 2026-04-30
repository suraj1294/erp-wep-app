import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/companies/$companySlug/dashboard")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const { requireCompanyAccess } = await import("@/lib/company-access");
          const { company, membership } = await requireCompanyAccess(
            request,
            params.companySlug
          );
          const { getCompanyDashboardSnapshot } = await import("@workspace/db");
          const dashboard = await getCompanyDashboardSnapshot(
            company.id,
            company.slug
          );

          return new Response(
            JSON.stringify({
              company,
              membership,
              ...dashboard,
            }),
            {
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to load dashboard.";
          const status =
            message === "Unauthorized"
              ? 401
              : message.includes("do not have access")
                ? 403
                : 500;

          return new Response(
            JSON.stringify({
              error: status >= 500 ? "Failed to load dashboard." : message,
            }),
            {
              status,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
