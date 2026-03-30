"use client"

import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PackageIcon } from "@hugeicons/core-free-icons"
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
import { cn } from "@workspace/ui/lib/utils"
import { ReportToolbar } from "@/components/reports/report-toolbar"
import { SummaryCard } from "@/components/reports/summary-card"
import { StatusBadge } from "@/components/masters/status-badge"
import { formatINR, formatNumber, safeParseFloat } from "@/lib/format"

interface ItemReportRow {
  id: string
  name: string
  code: string | null
  category: string | null
  brand: string | null
  unitId: string | null
  itemType: string | null
  hsnCode: string | null
  purchaseRate: string | null
  salesRate: string | null
  reorderLevel: string | null
  currentStock: string | null
  stockValue: string | null
  isActive: boolean | null
}

interface UnitOption {
  id: string
  name: string
  symbol: string | null
}

interface ItemsReportClientProps {
  items: ItemReportRow[]
  units: UnitOption[]
}

export function ItemsReportClient({
  items,
  units,
}: ItemsReportClientProps) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [brandFilter, setBrandFilter] = useState("all")
  const [itemTypeFilter, setItemTypeFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")

  const unitMap = useMemo(
    () => new Map(units.map((unit) => [unit.id, unit.symbol ?? unit.name])),
    [units]
  )

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          items.map((item) => item.category).filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [items]
  )

  const brands = useMemo(
    () =>
      Array.from(
        new Set(
          items.map((item) => item.brand).filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [items]
  )

  const summary = useMemo(() => {
    return {
      totalItems: items.length,
      totalStockValue: items.reduce(
        (sum, item) => sum + safeParseFloat(item.stockValue),
        0
      ),
      lowStock: items.filter(
        (item) =>
          safeParseFloat(item.currentStock) > 0 &&
          safeParseFloat(item.reorderLevel) > 0 &&
          safeParseFloat(item.currentStock) < safeParseFloat(item.reorderLevel)
      ).length,
      outOfStock: items.filter((item) => safeParseFloat(item.currentStock) <= 0)
        .length,
    }
  }, [items])

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return items.filter((item) => {
      const currentStock = safeParseFloat(item.currentStock)
      const reorderLevel = safeParseFloat(item.reorderLevel)
      const isLowStock =
        currentStock > 0 && reorderLevel > 0 && currentStock < reorderLevel
      const isOutOfStock = currentStock <= 0

      const matchesSearch =
        normalizedSearch.length === 0 ||
        `${item.name} ${item.code ?? ""} ${item.hsnCode ?? ""}`
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesCategory =
        categoryFilter === "all" || item.category === categoryFilter

      const matchesBrand =
        brandFilter === "all" || item.brand === brandFilter

      const matchesItemType =
        itemTypeFilter === "all" ||
        (item.itemType ?? "goods").toLowerCase() === itemTypeFilter

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" ? isLowStock : isOutOfStock)

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesItemType &&
        matchesStock
      )
    })
  }, [brandFilter, categoryFilter, itemTypeFilter, items, search, stockFilter])

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Items"
          value={String(summary.totalItems)}
          icon={<HugeiconsIcon icon={PackageIcon} strokeWidth={2} className="size-5" />}
        />
        <SummaryCard
          title="Total Stock Value"
          value={formatINR(summary.totalStockValue)}
        />
        <SummaryCard title="Low Stock" value={String(summary.lowStock)} />
        <SummaryCard title="Out of Stock" value={String(summary.outOfStock)} />
      </div>

      <ReportToolbar
        searchPlaceholder="Search name, code, or HSN code"
        onSearchChange={setSearch}
      >
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All item types" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All item types</SelectItem>
              <SelectItem value="goods">Goods</SelectItem>
              <SelectItem value="service">Services</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All stock</SelectItem>
              <SelectItem value="low">Low stock</SelectItem>
              <SelectItem value="out">Out of stock</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </ReportToolbar>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>HSN</TableHead>
              <TableHead className="text-right">Purchase Rate</TableHead>
              <TableHead className="text-right">Sales Rate</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead className="text-right">Stock Value</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  No items match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const currentStock = safeParseFloat(item.currentStock)
                const reorderLevel = safeParseFloat(item.reorderLevel)
                const isLowStock =
                  currentStock > 0 &&
                  reorderLevel > 0 &&
                  currentStock < reorderLevel

                return (
                  <TableRow
                    key={item.id}
                    className={cn(isLowStock ? "bg-amber-50 hover:bg-amber-50" : "")}
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.code ?? "—"}</TableCell>
                    <TableCell>{item.category ?? "—"}</TableCell>
                    <TableCell>
                      {item.unitId ? unitMap.get(item.unitId) ?? "—" : "—"}
                    </TableCell>
                    <TableCell>{item.hsnCode ?? "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatINR(item.purchaseRate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatINR(item.salesRate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(item.currentStock)}{" "}
                      {item.unitId ? unitMap.get(item.unitId) ?? "" : ""}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatINR(item.stockValue)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge active={item.isActive === true} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
