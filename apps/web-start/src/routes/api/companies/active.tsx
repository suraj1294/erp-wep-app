import { createFileRoute } from "@tanstack/react-router"
import { getFirstActiveCompanyForUser } from "@workspace/db"
import { requireSession } from "#/lib/auth-server"

export const Route = createFileRoute("/api/companies/active")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const session = await requireSession(request)
          const company = await getFirstActiveCompanyForUser(session.user.id)
          return new Response(JSON.stringify(company), {
            headers: { "content-type": "application/json" },
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load active company."
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