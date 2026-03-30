"use client"

import { useState, useTransition } from "react"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { MasterTable } from "@/components/masters/master-table"
import { MasterDialog } from "@/components/masters/master-dialog"
import { MasterDeleteDialog } from "@/components/masters/master-delete-dialog"
import { FormField } from "@/components/masters/form-field"
import { StatusBadge } from "@/components/masters/status-badge"
import { createItem, updateItem, deleteItem } from "./actions"

export interface ItemRow {
  id: string
  name: string
  code: string | null
  category: string | null
  unitId: string | null
  itemType: string | null
  taxRate: string | null
  purchaseRate: string | null
  salesRate: string | null
  isActive: boolean | null
}

export interface UnitOption {
  id: string
  name: string
  symbol: string | null
}

interface FormState {
  name: string
  code: string
  category: string
  itemType: string
  unitId: string
  hsnCode: string
  taxRate: string
  purchaseRate: string
  salesRate: string
  mrp: string
}

interface FormErrors {
  name?: string
}

interface ItemsClientProps {
  companySlug: string
  initialItems: ItemRow[]
  units: UnitOption[]
}

const defaultForm: FormState = {
  name: "",
  code: "",
  category: "",
  itemType: "goods",
  unitId: "",
  hsnCode: "",
  taxRate: "0",
  purchaseRate: "",
  salesRate: "",
  mrp: "",
}

export function ItemsClient({
  companySlug,
  initialItems,
  units,
}: ItemsClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<ItemRow | null>(null)
  const [deleting, setDeleting] = useState<ItemRow | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setEditing(null)
    setForm(defaultForm)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(row: ItemRow) {
    setEditing(row)
    setForm({
      name: row.name,
      code: row.code ?? "",
      category: row.category ?? "",
      itemType: row.itemType ?? "goods",
      unitId: row.unitId ?? "",
      hsnCode: "",
      taxRate: row.taxRate ?? "0",
      purchaseRate: row.purchaseRate ?? "",
      salesRate: row.salesRate ?? "",
      mrp: "",
    })
    setErrors({})
    setDialogOpen(true)
  }

  function openDelete(row: ItemRow) {
    setDeleting(row)
    setDeleteOpen(true)
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!form.name.trim()) newErrors.name = "Name is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    startTransition(async () => {
      const data = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        category: form.category.trim() || undefined,
        unitId: form.unitId || null,
        itemType: form.itemType || "goods",
        hsnCode: form.hsnCode.trim() || undefined,
        taxRate: form.taxRate || "0",
        purchaseRate: form.purchaseRate || undefined,
        salesRate: form.salesRate || undefined,
        mrp: form.mrp || undefined,
      }
      if (editing) {
        await updateItem(companySlug, editing.id, data)
      } else {
        await createItem(companySlug, data)
      }
      setDialogOpen(false)
    })
  }

  function handleDeleteConfirm() {
    if (!deleting) return
    startTransition(async () => {
      await deleteItem(companySlug, deleting.id)
      setDeleteOpen(false)
    })
  }

  const columns = [
    { key: "name" as const, label: "Name" },
    { key: "code" as const, label: "Code" },
    { key: "itemType" as const, label: "Type" },
    {
      key: "taxRate" as const,
      label: "Tax Rate",
      render: (value: unknown) =>
        value !== null && value !== undefined ? `${value}%` : "—",
    },
    { key: "salesRate" as const, label: "Sales Rate" },
    { key: "purchaseRate" as const, label: "Purchase Rate" },
    {
      key: "isActive" as const,
      label: "Status",
      render: (value: unknown) => <StatusBadge active={value === true} />,
    },
  ]

  return (
    <>
      <MasterTable
        title="Items"
        rows={initialItems}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={openDelete}
        addLabel="Add Item"
      />

      <MasterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Item" : "Add Item"}
        onSubmit={handleSubmit}
        isPending={isPending}
      >
        <FormField label="Name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Item name"
          />
        </FormField>
        <FormField label="Code">
          <Input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="Item code"
          />
        </FormField>
        <FormField label="Category">
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Electronics"
          />
        </FormField>
        <FormField label="Item Type">
          <Select
            value={form.itemType}
            onValueChange={(value) => setForm({ ...form, itemType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="goods">Goods</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Unit of Measure">
          <Select
            value={form.unitId || "none"}
            onValueChange={(value) =>
              setForm({ ...form, unitId: value === "none" ? "" : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} {u.symbol ? `(${u.symbol})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="HSN Code">
          <Input
            value={form.hsnCode}
            onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
            placeholder="HSN/SAC code"
          />
        </FormField>
        <FormField label="Tax Rate (%)">
          <Input
            type="number"
            value={form.taxRate}
            onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
            placeholder="0"
          />
        </FormField>
        <FormField label="Purchase Rate">
          <Input
            type="number"
            value={form.purchaseRate}
            onChange={(e) => setForm({ ...form, purchaseRate: e.target.value })}
            placeholder="0.00"
          />
        </FormField>
        <FormField label="Sales Rate">
          <Input
            type="number"
            value={form.salesRate}
            onChange={(e) => setForm({ ...form, salesRate: e.target.value })}
            placeholder="0.00"
          />
        </FormField>
        <FormField label="MRP">
          <Input
            type="number"
            value={form.mrp}
            onChange={(e) => setForm({ ...form, mrp: e.target.value })}
            placeholder="0.00"
          />
        </FormField>
      </MasterDialog>

      <MasterDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        name={deleting?.name ?? ""}
        isSystem={false}
        onConfirm={handleDeleteConfirm}
        isPending={isPending}
      />
    </>
  )
}
