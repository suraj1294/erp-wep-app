"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
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
            <TableRow>
              <TableHead>Date</TableHead>
              {showType && <TableHead>Type</TableHead>}
              <TableHead>Number</TableHead>
              <TableHead>Party</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
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
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`${basePath}/${row.id}`)}
                >
                  <TableCell className="font-mono text-xs">
                    {row.voucherDate}
                  </TableCell>
                  {showType && (
                    <TableCell className="text-xs">
                      {row.voucherTypeName ?? "—"}
                    </TableCell>
                  )}
                  <TableCell className="font-mono text-xs font-medium">
                    <Link
                      href={`${basePath}/${row.id}`}
                      className="hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {row.voucherNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.partyName ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    ₹{" "}
                    {parseFloat(row.totalAmount).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell>{statusBadge(row.status)}</TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <span className="sr-only">Open menu</span>
                          <span className="text-base leading-none">⋯</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => router.push(`${basePath}/${row.id}`)}
                        >
                          <HugeiconsIcon
                            icon={EyeIcon}
                            className="size-3.5"
                          />
                          View
                        </DropdownMenuItem>
                        {row.status !== "cancelled" && (
                          <DropdownMenuItem
                            onSelect={() =>
                              router.push(`${basePath}/${row.id}/edit`)
                            }
                          >
                            <HugeiconsIcon
                              icon={PencilEdit01Icon}
                              className="size-3.5"
                            />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {row.status !== "cancelled" && onCancel && (
                          <DropdownMenuItem
                            onClick={() => onCancel(row.id)}
                            className="text-destructive"
                          >
                            <HugeiconsIcon
                              icon={Cancel01Icon}
                              className="size-3.5"
                            />
                            Cancel
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
