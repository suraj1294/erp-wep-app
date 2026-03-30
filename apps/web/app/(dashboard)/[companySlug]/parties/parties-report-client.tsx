"use client"

import { Fragment, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon } from "@hugeicons/core-free-icons"
import { Badge } from "@workspace/ui/components/badge"
import {
  Collapsible,
  CollapsibleContent,
} from "@workspace/ui/components/collapsible"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { ReportToolbar } from "@/components/reports/report-toolbar"
import { SummaryCard } from "@/components/reports/summary-card"
import { StatusBadge } from "@/components/masters/status-badge"
import { formatINR } from "@/lib/format"

interface AddressValue {
  line1?: string
  line2?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
}

interface PartiesReportRow {
  id: string
  type: string
  name: string
  displayName: string | null
  contactPerson: string | null
  phone: string | null
  email: string | null
  gstin: string | null
  pan: string | null
  address: unknown
  creditLimit: string | null
  creditDays: number | null
  taxRegistration: unknown
  isActive: boolean | null
}

interface PartiesReportClientProps {
  parties: PartiesReportRow[]
}

function PartyTypeBadge({ type }: { type: string }) {
  const normalized = type.toLowerCase()

  if (normalized === "customer") {
    return (
      <Badge variant="outline" className="border-blue-200 bg-blue-500/10 text-blue-600">
        Customer
      </Badge>
    )
  }

  if (normalized === "supplier") {
    return (
      <Badge variant="outline" className="border-purple-200 bg-purple-500/10 text-purple-600">
        Supplier
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="border-teal-200 bg-teal-500/10 text-teal-600">
      Both
    </Badge>
  )
}

function formatAddress(address: PartiesReportRow["address"]) {
  if (!address) return "—"
  if (typeof address === "string") return address
  if (typeof address !== "object") return "—"

  const value = address as AddressValue

  const parts = [
    value.line1,
    value.line2,
    value.city,
    value.state,
    value.pincode,
    value.country,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(", ") : "—"
}

function formatTaxRegistration(value: PartiesReportRow["taxRegistration"]) {
  if (!value || typeof value !== "object" || Object.keys(value).length === 0) {
    return "—"
  }

  return Object.entries(value as Record<string, unknown>)
    .map(([key, entry]) => `${key}: ${String(entry)}`)
    .join(", ")
}

export function PartiesReportClient({
  parties,
}: PartiesReportClientProps) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedPartyId, setExpandedPartyId] = useState<string | null>(null)

  const summary = useMemo(() => {
    return {
      total: parties.length,
      customers: parties.filter((party) => party.type === "customer").length,
      suppliers: parties.filter((party) => party.type === "supplier").length,
      active: parties.filter((party) => party.isActive === true).length,
      inactive: parties.filter((party) => party.isActive !== true).length,
    }
  }, [parties])

  const filteredParties = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return parties.filter((party) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${party.name} ${party.phone ?? ""} ${party.email ?? ""} ${party.gstin ?? ""}`
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesType =
        typeFilter === "all" ||
        party.type.toLowerCase() === typeFilter

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active"
          ? party.isActive === true
          : party.isActive !== true)

      return matchesSearch && matchesType && matchesStatus
    })
  }, [parties, search, statusFilter, typeFilter])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Total Parties"
          value={String(summary.total)}
          icon={<HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-5" />}
        />
        <SummaryCard title="Customers" value={String(summary.customers)} />
        <SummaryCard title="Suppliers" value={String(summary.suppliers)} />
        <SummaryCard title="Active" value={String(summary.active)} />
        <SummaryCard title="Inactive" value={String(summary.inactive)} />
      </div>

      <ReportToolbar
        searchPlaceholder="Search name, phone, email, or GSTIN"
        onSearchChange={setSearch}
      >
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </ReportToolbar>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              <TableHead className="text-right">Credit Days</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No parties match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredParties.map((party) => {
                const isExpanded = expandedPartyId === party.id

                return (
                  <Fragment key={party.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedPartyId((current) =>
                          current === party.id ? null : party.id
                        )
                      }
                    >
                      <TableCell className="font-medium">{party.name}</TableCell>
                      <TableCell>
                        <PartyTypeBadge type={party.type} />
                      </TableCell>
                      <TableCell>{party.contactPerson ?? "—"}</TableCell>
                      <TableCell>{party.phone ?? "—"}</TableCell>
                      <TableCell>{party.email ?? "—"}</TableCell>
                      <TableCell>{party.gstin ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatINR(party.creditLimit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {party.creditDays ?? 0}
                      </TableCell>
                      <TableCell>
                        <StatusBadge active={party.isActive === true} />
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${party.id}-details`} className="hover:bg-transparent">
                      <TableCell colSpan={9} className="p-0">
                        <Collapsible open={isExpanded}>
                          <CollapsibleContent>
                            <div className="grid gap-3 bg-muted/20 p-4 md:grid-cols-2 xl:grid-cols-4">
                              <div>
                                <p className="text-muted-foreground">Display Name</p>
                                <p>{party.displayName || "—"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">PAN</p>
                                <p>{party.pan || "—"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Address</p>
                                <p>{formatAddress(party.address)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Tax Registration</p>
                                <p>{formatTaxRegistration(party.taxRegistration)}</p>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </TableCell>
                    </TableRow>
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
