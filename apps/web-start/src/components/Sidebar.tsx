import { useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  label: string;
  href: string;
}

interface SidebarProps {
  companySlug: string;
  companyName: string;
  companies?: { id: string; name: string; slug: string }[];
}

export function Sidebar({ companySlug, companyName, companies }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isMastersOpen, setIsMastersOpen] = useState(
    location.pathname.startsWith(`/app/${companySlug}/masters`)
  );

  const mainNavItems: NavItem[] = [
    { label: "Dashboard", href: `/app/${companySlug}` },
  ];

  const masterNavItems: NavItem[] = [
    { label: "Account Groups", href: `/app/${companySlug}/masters/account-groups` },
    { label: "Accounts", href: `/app/${companySlug}/masters/accounts` },
    { label: "Voucher Types", href: `/app/${companySlug}/masters/voucher-types` },
    { label: "Parties", href: `/app/${companySlug}/masters/parties` },
    { label: "Items", href: `/app/${companySlug}/masters/items` },
    { label: "Units of Measure", href: `/app/${companySlug}/masters/units` },
  ];

  function handleCompanySwitch(e: React.ChangeEvent<HTMLSelectElement>) {
    navigate({ to: "/app/$companySlug", params: { companySlug: e.target.value } });
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-gray-50">
      <div className="border-b p-4">
        <a href={`/app/${companySlug}`} className="flex items-center gap-3 no-underline">
          <div className="flex size-8 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-sm">
            T
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-gray-900 text-sm">Tally ERP</span>
            <span className="text-xs text-gray-500 truncate">{companyName}</span>
          </div>
        </a>
        {companies && companies.length > 1 && (
          <select
            value={companySlug}
            onChange={handleCompanySwitch}
            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {companies.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <div className="mb-4">
          <p className="px-3 py-2 text-xs font-semibold uppercase text-gray-400">Main</p>
          {mainNavItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm no-underline transition ${
                location.pathname === item.href
                  ? "bg-teal-100 text-teal-700 font-medium"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="mb-4">
          <p className="px-3 py-2 text-xs font-semibold uppercase text-gray-400">Masters</p>
          <button
            onClick={() => setIsMastersOpen(!isMastersOpen)}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-200 transition"
          >
            <span>Masters</span>
            <span className={`transition ${isMastersOpen ? "rotate-180" : ""}`}>&#9662;</span>
          </button>
          {isMastersOpen && (
            <div className="ml-2 mt-1 border-l border-gray-200 pl-2">
              {masterNavItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-md px-3 py-1.5 text-sm no-underline transition ${
                    location.pathname === item.href
                      ? "bg-teal-100 text-teal-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t p-4">
        {user && (
          <div className="mb-2">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name || user.email}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        )}
        <div className="flex gap-2">
          {user && (
            <button
              onClick={signOut}
              className="flex-1 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 transition text-center"
            >
              Sign out
            </button>
          )}
          <a
            href="/app"
            className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 no-underline hover:bg-gray-50 transition text-center"
          >
            Companies
          </a>
        </div>
      </div>
    </aside>
  );
}