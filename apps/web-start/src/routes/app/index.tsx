import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { createCompany, getAccessibleCompanies } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/app/")({
  component: CompanySelection,
});

interface Company {
  id: string;
  name: string;
  slug: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
}

function CompanySelection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [error, setError] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const isDemo = !isAuthenticated;
  const companiesQuery = useQuery({
    queryKey: queryKeys.companies.accessible(),
    queryFn: getAccessibleCompanies,
    enabled: isAuthenticated,
  });
  const createCompanyMutation = useMutation({
    mutationFn: (name: string) => createCompany({ name }),
    onSuccess: async (company) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.accessible() });
      navigate({ to: "/app/$companySlug", params: { companySlug: company.slug } });
    },
  });

  const companies = useMemo<Company[]>(() => {
    if (isDemo) {
      return [
        { id: "demo-1", name: "Acme Corporation", slug: "acme-corp", displayName: "Acme Corporation", role: "owner", isActive: true },
        { id: "demo-2", name: "Beta Industries", slug: "beta-industries", displayName: "Beta Industries", role: "owner", isActive: true },
      ];
    }

    return companiesQuery.data ?? [];
  }, [companiesQuery.data, isDemo]);

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setError("");
    try {
      await createCompanyMutation.mutateAsync(newCompanyName.trim());
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to create company"
      );
    }
  }

  if (companiesQuery.isLoading) {
    return (
      <div className="flex h-svh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-xl">
            T
          </div>
          <h1 className="text-xl font-bold text-gray-900">Select a Company</h1>
          <p className="mt-2 text-sm text-gray-600">
            {isDemo ? "Running in demo mode" : `Signed in as ${user?.email}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div className="space-y-3">
          {companies.map((company) => (
            <a
              key={company.id}
              href={`/app/${company.slug}${isDemo ? "?demo=1" : ""}`}
              className="flex items-center justify-between rounded-lg border bg-white p-4 no-underline shadow-sm transition hover:border-teal-300 hover:shadow-md"
            >
              <div>
                <h3 className="font-medium text-gray-900">{company.displayName || company.name}</h3>
                <p className="text-sm text-gray-500">/{company.slug}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 capitalize">
                  {company.role}
                </span>
                <span className="text-gray-400">&#8594;</span>
              </div>
            </a>
          ))}
        </div>

        {isAuthenticated && (
          <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-medium text-gray-900">Create New Company</h2>
            <form onSubmit={handleCreateCompany} className="space-y-3">
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Company name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              />
              <button
                type="submit"
                className="w-full rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Create Company
              </button>
            </form>
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">Back to home</a>
        </div>
      </div>
    </div>
  );
}
