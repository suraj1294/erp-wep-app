"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  EyeIcon,
  PencilEdit01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export interface VoucherRow {
  id: string
  voucherNumber: string
  voucherDate: string
  partyName: string | null
  totalAmount: string
  status: string | null
  voucherTypeName?: string
}

interface VoucherListTableProps {
  title: string
  rows: VoucherRow[]
  newHref: string
  newLabel?: string
  /** Base path for view/edit — e.g. "/{companySlug}/sales" */
  basePath: string
  onCancel?: (id: string) => void
  /** Show voucher type column (used on banking list) */
  showType?: boolean
}

function statusBadge(status: string | null) {
  if (status === "cancelled")
    return <Badge variant="destructive">Cancelled</Badge>
  return (
    <Badge
      variant="secondary"
      className="bg-green-100 text-green-800 hover:bg-green-100"
    >
      Active
    </Badge>
  )
}

export function VoucherListTable({
  title,
  rows,
  newHref,
  newLabel = "New",
  basePath,
  onCancel,
  showType = false,
}: VoucherListTableProps) {
  const router = useRouter()
  const tableColumns = [
    {
      accessorKey: "voucherDate",
      header: "Date",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{String(getValue())}</span>
      ),
    },
    ...(showType
      ? [
          {
            accessorKey: "voucherTypeName",
            header: "Type",
            cell: ({ getValue }) => (
              <span className="text-xs">{String(getValue() ?? "—")}</span>
            ),
          } satisfies ColumnDef<VoucherRow>,
        ]
      : []),
    {
      accessorKey: "voucherNumber",
      header: "Number",
      cell: ({ row, getValue }) => (
        <Link
          href={`${basePath}/${row.original.id}`}
          className="font-mono text-xs font-medium hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {String(getValue())}
        </Link>
      ),
    },
    {
      accessorKey: "partyName",
      header: "Party",
      cell: ({ getValue }) => (
        <span className="text-xs">{String(getValue() ?? "—")}</span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: () => <span className="block text-right">Amount</span>,
      cell: ({ getValue }) => (
        <span className="block text-right font-mono text-xs">
          ₹{" "}
          {parseFloat(String(getValue())).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => statusBadge(String(getValue() ?? "active")),
    },
    {
      id: "actions",
      header: () => <span className="block text-right">Actions</span>,
      cell: ({ row }) => (
        <div className="text-right" onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <span className="sr-only">Open menu</span>
                <span className="text-base leading-none">⋯</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => router.push(`${basePath}/${row.original.id}`)}
              >
                <HugeiconsIcon icon={EyeIcon} className="size-3.5" />
                View
              </DropdownMenuItem>
              {row.original.status !== "cancelled" && (
                <DropdownMenuItem
                  onSelect={() =>
                    router.push(`${basePath}/${row.original.id}/edit`)
                  }
                >
                  <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5" />
                  Edit
                </DropdownMenuItem>
              )}
              {row.original.status !== "cancelled" && onCancel && (
                <DropdownMenuItem
                  onClick={() => onCancel(row.original.id)}
                  className="text-destructive"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                  Cancel
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ] satisfies ColumnDef<VoucherRow>[]
  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <Button size="sm" asChild>
          <Link href={newHref}>
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
            {newLabel}
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.id === "actions" ? "w-[80px] text-right" : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showType ? 7 : 6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No vouchers found. Create your first one.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`${basePath}/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={
                        cell.column.id === "actions" ? "text-right" : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
