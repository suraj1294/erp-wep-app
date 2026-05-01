import { createFileRoute } from "@tanstack/react-router"
import { listActiveCompaniesForUser } from "@workspace/db"
import { requireSession } from "#/lib/auth-server"

export const Route = createFileRoute("/api/companies/accessible")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const session = await requireSession(request)
          const companies = await listActiveCompaniesForUser(session.user.id)
          return new Response(JSON.stringify(companies), {
            headers: { "content-type": "application/json" },
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load companies."
          const status = message === "Unauthorized" ? 401 : 500
          return new Response(JSON.stringify({ error: message }), {
            status,
            headers: { "content-type": "application/json" },
          })
        }
      },
    },
  },
})