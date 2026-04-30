import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/companies/active")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { auth } = await import("@/lib/auth");
          const session = await auth.api.getSession({ headers: request.headers });
          if (!session?.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const { getFirstActiveCompanyForUser } = await import("@workspace/db");
          const company = await getFirstActiveCompanyForUser(session.user.id);
          return new Response(JSON.stringify(company), { headers: { "Content-Type": "application/json" } });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load active company.";
          const status = message === "Unauthorized" ? 401 : 500;
          return new Response(JSON.stringify({ error: status >= 500 ? "Failed to load active company." : message }), { status, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});