import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/$companySlug")({
  component: CompanyLayout,
});

function CompanyLayout() {
  const { companySlug } = Route.useParams();
  const { user } = useAuth();
  const companyName = companySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="flex h-screen">
      <Sidebar
        companySlug={companySlug}
        companyName={companyName}
      />
      <main className="flex-1 overflow-auto bg-white">
        <header className="flex h-14 items-center justify-between gap-3 border-b px-6">
          <span className="text-sm font-medium text-gray-700">{companyName}</span>
          {user && (
            <span className="text-xs text-gray-500">{user.email}</span>
          )}
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}