"use client"

import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit01Icon, Delete01Icon, Add01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

interface Column<T> {
  key: keyof T & string
  label: string
  render?: (value: unknown, row: T) => React.ReactNode
}

interface MasterTableProps<T extends { id: string }> {
  title: string
  rows: T[]
  columns: Column<T>[]
  onAdd: () => void
  onEdit: (row: T) => void
  onDelete: (row: T) => void
  addLabel?: string
}

export function MasterTable<T extends { id: string }>({
  title,
  rows,
  columns,
  onAdd,
  onEdit,
  onDelete,
  addLabel = "Add",
}: MasterTableProps<T>) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <Button onClick={onAdd} size="sm">
          <HugeiconsIcon icon={Add01Icon} size={16} className="mr-2" />
          {addLabel}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center text-muted-foreground"
                >
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render
                        ? col.render(row[col.key as keyof T], row)
                        : String(row[col.key as keyof T] ?? "")}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(row)}
                        aria-label="Edit"
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(row)}
                        aria-label="Delete"
                      >
                        <HugeiconsIcon icon={Delete01Icon} size={16} />
                      </Button>
                    </div>
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
