"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import { Separator } from "@workspace/ui/components/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Book01Icon,
  DashboardSquare01Icon,
  Database01Icon,
  Invoice01Icon,
  Logout01Icon,
  Package01Icon,
  ShoppingCart01Icon,
  User02Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

interface Company {
  id: string
  name: string
  displayName: string | null
  role: string
}

interface DashboardShellProps {
  user: { id: string; name: string; email: string }
  companies: Company[]
  currentCompanyId: string
  children: React.ReactNode
}

interface NavItem {
  label: string
  href: string
  icon: IconSvgElement
}

interface MasterNavItem {
  label: string
  href: string
}

export function DashboardShell({
  user,
  companies,
  currentCompanyId,
  children,
}: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const currentCompany = companies.find((c) => c.id === currentCompanyId)

  const mainNavItems: NavItem[] = [
    { label: "Dashboard", href: `/${currentCompanyId}`,           icon: DashboardSquare01Icon },
    { label: "Sales",     href: `/${currentCompanyId}/sales`,     icon: Invoice01Icon },
    { label: "Purchase",  href: `/${currentCompanyId}/purchase`,  icon: ShoppingCart01Icon },
    { label: "Banking",   href: `/${currentCompanyId}/banking`,   icon: Wallet01Icon },
  ]

  const masterNavItems: MasterNavItem[] = [
    { label: "Account Groups",    href: `/${currentCompanyId}/masters/account-groups` },
    { label: "Accounts",          href: `/${currentCompanyId}/masters/accounts` },
    { label: "Voucher Types",     href: `/${currentCompanyId}/masters/voucher-types` },
    { label: "Parties",           href: `/${currentCompanyId}/masters/parties` },
    { label: "Items",             href: `/${currentCompanyId}/masters/items` },
    { label: "Units of Measure",  href: `/${currentCompanyId}/masters/units` },
    { label: "Locations",         href: `/${currentCompanyId}/masters/locations` },
  ]

  const reportNavItems: NavItem[] = [
    { label: "Chart of Accounts", href: `/${currentCompanyId}/accounts`, icon: Book01Icon },
    { label: "Parties",           href: `/${currentCompanyId}/parties`,  icon: User02Icon },
    { label: "Items",             href: `/${currentCompanyId}/items`,    icon: Package01Icon },
  ]

  const isMastersActive = pathname.startsWith(`/${currentCompanyId}/masters`)

  function handleCompanyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value) router.push(`/${e.target.value}`)
  }

  async function handleSignOut() {
    await signOut()
    router.push("/sign-in")
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href={`/${currentCompanyId}`}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
                    T
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">Tally ERP</span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {currentCompany?.displayName || currentCompany?.name}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Company switcher — shown when user belongs to multiple companies */}
          {companies.length > 1 && (
            <div className="px-2 pb-1">
              <select
                className="w-full rounded-md border bg-sidebar px-2 py-1.5 text-xs text-sidebar-foreground focus:outline-none"
                value={currentCompanyId}
                onChange={handleCompanyChange}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName || c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </SidebarHeader>

        {/* ── Content ────────────────────────────────────────────────── */}
        <SidebarContent>
          {/* Main navigation */}
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <HugeiconsIcon icon={item.icon} className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          {/* Masters — collapsible sub-menu */}
          <SidebarGroup>
            <SidebarGroupLabel>Masters</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <Collapsible defaultOpen={isMastersActive} className="group/collapsible">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip="Masters" isActive={isMastersActive}>
                      <HugeiconsIcon icon={Database01Icon} className="size-4" />
                      <span>Masters</span>
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        className="ml-auto size-3 transition-transform group-data-[state=open]/collapsible:rotate-180"
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {masterNavItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                            <Link href={item.href}>{item.label}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {/* Reports / Views */}
          <SidebarGroup>
            <SidebarGroupLabel>Reports</SidebarGroupLabel>
            <SidebarMenu>
              {reportNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link href={item.href}>
                      <HugeiconsIcon icon={item.icon} className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="px-2 py-1.5">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user.name}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {user.email}
                </p>
                {currentCompany && (
                  <p className="mt-0.5 text-xs capitalize text-sidebar-foreground/40">
                    {currentCompany.role}
                  </p>
                )}
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleSignOut}
                tooltip="Sign out"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <HugeiconsIcon icon={Logout01Icon} className="size-4" />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* ── Main content ───────────────────────────────────────────── */}
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          {currentCompany && (
            <span className="text-sm font-medium">
              {currentCompany.displayName || currentCompany.name}
            </span>
          )}
        </header>
        <div className="flex-1 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
