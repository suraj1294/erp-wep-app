import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/companies/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { auth } = await import("@/lib/auth");
          const session = await auth.api.getSession({ headers: request.headers });
          if (!session?.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const body = await request.json();
          const name = (body as { name?: string }).name?.trim();
          if (!name) {
            return new Response(JSON.stringify({ error: "Company name is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
          }

          const { createCompanyRecord, addCompanyOwnerMembership, seedCompanyDefaults } = await import("@workspace/db");
          const company = await createCompanyRecord({
            name,
            displayName: (body as { displayName?: string }).displayName?.trim() || name,
            email: (body as { email?: string }).email || null,
            phone: (body as { phone?: string }).phone || null,
            gstin: (body as { gstin?: string }).gstin || null,
            pan: (body as { pan?: string }).pan || null,
            createdBy: session.user.id,
          });

          await addCompanyOwnerMembership(company.id, session.user.id);

          if ((body as { seedDefaults?: boolean }).seedDefaults !== false) {
            try {
              await seedCompanyDefaults(company.id);
            } catch {}
          }

          return new Response(JSON.stringify(company), { status: 201, headers: { "Content-Type": "application/json" } });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create company.";
          const status = message === "Unauthorized" ? 401 : 500;
          return new Response(JSON.stringify({ error: status >= 500 ? "Failed to create company." : message }), { status, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});