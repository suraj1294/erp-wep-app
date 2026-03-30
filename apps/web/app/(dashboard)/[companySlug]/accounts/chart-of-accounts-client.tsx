"use client"

import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  ArrowDown01Icon,
  ChartBarLineIcon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@workspace/ui/components/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import { ReportToolbar } from "@/components/reports/report-toolbar"
import { SummaryCard } from "@/components/reports/summary-card"
import { formatINR, safeParseFloat } from "@/lib/format"

interface AccountGroupRow {
  id: string
  name: string
  code: string | null
  parentId: string | null
  accountType: string
  nature: string
  level: number | null
  isActive: boolean | null
}

interface AccountRow {
  id: string
  groupId: string | null
  name: string
  code: string | null
  openingBalance: string | null
  currentBalance: string | null
  isActive: boolean | null
}

interface ChartOfAccountsClientProps {
  groups: AccountGroupRow[]
  accounts: AccountRow[]
}

interface GroupNode {
  id: string
  name: string
  code: string | null
  parentId: string | null
  accountType: string
  nature: string
  level: number | null
  isActive: boolean | null
  children: GroupNode[]
  accounts: AccountRow[]
  totalBalance: number
  match: boolean
  hasVisibleDescendant: boolean
}

const accountTypeOptions = ["all", "asset", "liability", "income", "expense"]
const natureOptions = ["all", "debit", "credit"]

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase()
}

function matchesGroupFilters(
  group: AccountGroupRow,
  accountTypeFilter: string,
  natureFilter: string
) {
  if (
    accountTypeFilter !== "all" &&
    normalize(group.accountType) !== accountTypeFilter
  ) {
    return false
  }

  if (natureFilter !== "all" && normalize(group.nature) !== natureFilter) {
    return false
  }

  return true
}

function matchesSearch(group: AccountGroupRow, search: string) {
  const haystack = `${group.name} ${group.code ?? ""} ${group.accountType}`.toLowerCase()
  return haystack.includes(search)
}

function matchesAccountSearch(account: AccountRow, search: string) {
  const haystack = `${account.name} ${account.code ?? ""}`.toLowerCase()
  return haystack.includes(search)
}

function buildTree(
  groups: AccountGroupRow[],
  accounts: AccountRow[],
  search: string,
  accountTypeFilter: string,
  natureFilter: string
) {
  const groupsById = new Map<string, GroupNode>()

  for (const group of groups) {
    groupsById.set(group.id, {
      ...group,
      children: [],
      accounts: [],
      totalBalance: 0,
      match: false,
      hasVisibleDescendant: false,
    })
  }

  for (const account of accounts) {
    if (!account.groupId) continue
    const group = groupsById.get(account.groupId)
    if (group) {
      group.accounts.push(account)
    }
  }

  const roots: GroupNode[] = []

  for (const group of groups) {
    const node = groupsById.get(group.id)
    if (!node) continue

    if (group.parentId) {
      const parent = groupsById.get(group.parentId)
      if (parent) {
        parent.children.push(node)
        continue
      }
    }

    roots.push(node)
  }

  const autoExpandedIds = new Set<string>()

  function visit(node: GroupNode, depth: number): GroupNode | null {
    if (depth > 10) {
      return null
    }

    const visibleChildren = node.children
      .map((child) => visit(child, depth + 1))
      .filter((child): child is GroupNode => child !== null)

    const filteredAccounts = node.accounts.filter((account) => {
      const accountMatchesSearch =
        search.length === 0 || matchesAccountSearch(account, search)
      return accountMatchesSearch
    })

    const ownAccountTotal = node.accounts.reduce(
      (sum, account) => sum + safeParseFloat(account.currentBalance),
      0
    )

    const descendantTotal = node.children.reduce(
      (sum, child) => sum + child.totalBalance,
      0
    )

    const totalBalance = ownAccountTotal + descendantTotal
    const groupMatchesFilter = matchesGroupFilters(
      node,
      accountTypeFilter,
      natureFilter
    )
    const groupMatchesSearch = search.length === 0 || matchesSearch(node, search)
    const hasVisibleDescendant =
      visibleChildren.length > 0 || filteredAccounts.length > 0
    const isVisible = groupMatchesFilter && (groupMatchesSearch || hasVisibleDescendant)

    if (!isVisible) {
      return null
    }

    if (search.length > 0 && hasVisibleDescendant) {
      autoExpandedIds.add(node.id)
    }

    return {
      ...node,
      children: visibleChildren,
      accounts: filteredAccounts,
      totalBalance,
      match: groupMatchesSearch,
      hasVisibleDescendant,
    }
  }

  return {
    roots: roots
      .map((root) => visit(root, 1))
      .filter((root): root is GroupNode => root !== null),
    autoExpandedIds,
  }
}

function AccountTypeBadge({ accountType }: { accountType: string }) {
  return (
    <Badge variant="outline" className="capitalize">
      {accountType}
    </Badge>
  )
}

interface GroupTreeNodeProps {
  node: GroupNode
  depth: number
  expandedGroups: Set<string>
  autoExpandedIds: Set<string>
  onToggle: (groupId: string) => void
}

function GroupTreeNode({
  node,
  depth,
  expandedGroups,
  autoExpandedIds,
  onToggle,
}: GroupTreeNodeProps) {
  const hasChildren = node.children.length > 0 || node.accounts.length > 0
  const isOpen = autoExpandedIds.has(node.id) || expandedGroups.has(node.id)
  const paddingLeft = `${depth * 1.25}rem`

  return (
    <Collapsible open={isOpen} onOpenChange={() => onToggle(node.id)}>
      <div className="rounded-lg border">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex min-w-0 items-center gap-2"
            style={{ paddingLeft }}
          >
            {hasChildren ? (
              <CollapsibleTrigger className="rounded-sm p-1 text-muted-foreground hover:bg-muted">
                <HugeiconsIcon
                  icon={isOpen ? ArrowDown01Icon : ArrowRight01Icon}
                  strokeWidth={2}
                  className="size-4"
                />
              </CollapsibleTrigger>
            ) : (
              <span className="size-6 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="font-medium">{node.name}</p>
              <p className="text-muted-foreground">
                {[node.code, node.nature].filter(Boolean).join(" • ")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <AccountTypeBadge accountType={node.accountType} />
            <span className="font-medium tabular-nums">
              {formatINR(node.totalBalance)}
            </span>
          </div>
        </div>

        {hasChildren ? (
          <CollapsibleContent>
            <div className="border-t">
              {node.children.map((child) => (
                <div key={child.id} className="border-b last:border-b-0">
                  <GroupTreeNode
                    node={child}
                    depth={depth + 1}
                    expandedGroups={expandedGroups}
                    autoExpandedIds={autoExpandedIds}
                    onToggle={onToggle}
                  />
                </div>
              ))}
              {node.accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  style={{ paddingLeft: `${(depth + 1) * 1.25}rem` }}
                >
                  <div className="min-w-0">
                    <p>{account.name}</p>
                    <p className="text-muted-foreground">
                      {account.code ?? "No code"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                    <span className="text-muted-foreground tabular-nums">
                      Opening: {formatINR(account.openingBalance)}
                    </span>
                    <span className="font-medium tabular-nums">
                      Current: {formatINR(account.currentBalance)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        ) : null}
      </div>
    </Collapsible>
  )
}

export function ChartOfAccountsClient({
  groups,
  accounts,
}: ChartOfAccountsClientProps) {
  const [search, setSearch] = useState("")
  const [accountTypeFilter, setAccountTypeFilter] = useState("all")
  const [natureFilter, setNatureFilter] = useState("all")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const summary = useMemo(() => {
    const groupById = new Map(groups.map((group) => [group.id, group]))
    const totals = {
      asset: 0,
      liability: 0,
      income: 0,
      expense: 0,
    }

    for (const account of accounts) {
      if (!account.groupId) continue
      const group = groupById.get(account.groupId)
      if (!group) continue
      const key = normalize(group.accountType) as keyof typeof totals
      if (key in totals) {
        totals[key] += safeParseFloat(account.currentBalance)
      }
    }

    return totals
  }, [accounts, groups])

  const { roots, autoExpandedIds } = useMemo(
    () =>
      buildTree(
        groups,
        accounts,
        search.trim().toLowerCase(),
        accountTypeFilter,
        natureFilter
      ),
    [accountTypeFilter, accounts, groups, natureFilter, search]
  )

  function toggleGroup(groupId: string) {
    setExpandedGroups((current) => {
      const next = new Set(current)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Assets"
          value={formatINR(summary.asset)}
          icon={<HugeiconsIcon icon={ChartBarLineIcon} strokeWidth={2} className="size-5" />}
        />
        <SummaryCard
          title="Total Liabilities"
          value={formatINR(summary.liability)}
          icon={<HugeiconsIcon icon={ChartBarLineIcon} strokeWidth={2} className="size-5" />}
        />
        <SummaryCard
          title="Total Income"
          value={formatINR(summary.income)}
          icon={<HugeiconsIcon icon={ChartBarLineIcon} strokeWidth={2} className="size-5" />}
        />
        <SummaryCard
          title="Total Expenses"
          value={formatINR(summary.expense)}
          icon={<HugeiconsIcon icon={ChartBarLineIcon} strokeWidth={2} className="size-5" />}
        />
      </div>

      <ReportToolbar
        searchPlaceholder="Search accounts, groups, or codes"
        onSearchChange={setSearch}
      >
        <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All account types" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {accountTypeOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? "All account types" : option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={natureFilter} onValueChange={setNatureFilter}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="All natures" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {natureOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? "All natures" : option}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </ReportToolbar>

      {roots.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No account groups or accounts match the current filters.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {roots.map((node) => (
            <div key={node.id} className={cn(node.match ? "ring-1 ring-ring/20" : "")}>
              <GroupTreeNode
                node={node}
                depth={0}
                expandedGroups={expandedGroups}
                autoExpandedIds={autoExpandedIds}
                onToggle={toggleGroup}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
