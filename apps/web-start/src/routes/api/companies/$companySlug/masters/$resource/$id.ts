import { createFileRoute } from "@tanstack/react-router";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

export const Route = createFileRoute("/api/companies/$companySlug/masters/$resource/$id")({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        try {
          const { companySlug, resource, id } = params;
          const db = await import("@workspace/db");
          if (!db.isCompanyMasterResource(resource)) {
            return errorResponse("Master resource not found.", 404);
          }

          const { requireCompanyAccess } = await import("@/lib/company-access");
          const { company } = await requireCompanyAccess(request, companySlug);
          const companyId = company.id;

          const body = await request.json();
          await db.updateCompanyMasterRecord(companyId, resource, id, body);

          return jsonResponse({ ok: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to update record.";
          const status = message === "Unauthorized" ? 401 : message.includes("do not have access") ? 403 : 500;
          return errorResponse(status >= 500 ? "Failed to update record." : message, status);
        }
      },
      DELETE: async ({ request, params }) => {
        try {
          const { companySlug, resource, id } = params;
          const db = await import("@workspace/db");
          if (!db.isCompanyMasterResource(resource)) {
            return errorResponse("Master resource not found.", 404);
          }

          const { requireCompanyAccess } = await import("@/lib/company-access");
          const { company } = await requireCompanyAccess(request, companySlug);
          const companyId = company.id;

          await db.deleteCompanyMasterRecord(companyId, resource, id);

          return jsonResponse({ ok: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to delete record.";
          const status = message === "Unauthorized" ? 401 : message.includes("do not have access") ? 403 : 500;
          return errorResponse(status >= 500 ? "Failed to delete record." : message, status);
        }
      },
    },
  },
});
