import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/companies/accessible")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { auth } = await import("@/lib/auth");
          const session = await auth.api.getSession({ headers: request.headers });
          if (!session?.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const { listActiveCompaniesForUser } = await import("@workspace/db");
          const companies = await listActiveCompaniesForUser(session.user.id);
          return new Response(JSON.stringify(companies), { headers: { "Content-Type": "application/json" } });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load companies.";
          const status = message === "Unauthorized" ? 401 : 500;
          return new Response(JSON.stringify({ error: status >= 500 ? "Failed to load companies." : message }), { status, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});