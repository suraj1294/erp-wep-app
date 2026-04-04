"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@workspace/ui/components/sonner"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import { MasterTable } from "@/components/masters/master-table"
import { MasterDialog } from "@/components/masters/master-dialog"
import { MasterDeleteDialog } from "@/components/masters/master-delete-dialog"
import { FormField } from "@/components/masters/form-field"
import { StatusBadge } from "@/components/masters/status-badge"
import { createUnit, updateUnit, deleteUnit } from "@/lib/api/masters"

export interface UnitRow {
  id: string
  name: string
  symbol: string | null
  decimalPlaces: number | null
  isBaseUnit: boolean | null
  isActive: boolean | null
}

interface FormState {
  name: string
  symbol: string
  decimalPlaces: string
  isBaseUnit: boolean
  conversionFactor: string
}

interface FormErrors {
  name?: string
  symbol?: string
}

interface UnitsClientProps {
  companySlug: string
  initialUnits: UnitRow[]
}

const defaultForm: FormState = {
  name: "",
  symbol: "",
  decimalPlaces: "2",
  isBaseUnit: false,
  conversionFactor: "1",
}

export function UnitsClient({ companySlug, initialUnits }: UnitsClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<UnitRow | null>(null)
  const [deleting, setDeleting] = useState<UnitRow | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setEditing(null)
    setForm(defaultForm)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(row: UnitRow) {
    setEditing(row)
    setForm({
      name: row.name,
      symbol: row.symbol ?? "",
      decimalPlaces: String(row.decimalPlaces ?? 2),
      isBaseUnit: row.isBaseUnit ?? false,
      conversionFactor: "1",
    })
    setErrors({})
    setDialogOpen(true)
  }

  function openDelete(row: UnitRow) {
    setDeleting(row)
    setDeleteOpen(true)
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.symbol.trim()) newErrors.symbol = "Symbol is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    startTransition(async () => {
      try {
        const data = {
          name: form.name.trim(),
          symbol: form.symbol.trim(),
          decimalPlaces: parseInt(form.decimalPlaces, 10) || 2,
          isBaseUnit: form.isBaseUnit,
          conversionFactor: form.conversionFactor || "1",
        }
        if (editing) {
          await updateUnit(companySlug, editing.id, data)
        } else {
          await createUnit(companySlug, data)
        }
        setDialogOpen(false)
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save unit."
        )
      }
    })
  }

  function handleDeleteConfirm() {
    if (!deleting) return
    startTransition(async () => {
      try {
        await deleteUnit(companySlug, deleting.id)
        setDeleteOpen(false)
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete unit."
        )
      }
    })
  }

  const columns = [
    { key: "name" as const, label: "Name" },
    { key: "symbol" as const, label: "Symbol" },
    { key: "decimalPlaces" as const, label: "Decimal Places" },
    {
      key: "isBaseUnit" as const,
      label: "Base Unit",
      render: (value: unknown) => (value ? "Yes" : "No"),
    },
    {
      key: "isActive" as const,
      label: "Status",
      render: (value: unknown) => <StatusBadge active={value === true} />,
    },
  ]

  return (
    <>
      <MasterTable
        title="Units of Measure"
        rows={initialUnits}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={openDelete}
        addLabel="Add Unit"
      />

      <MasterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Unit" : "Add Unit"}
        onSubmit={handleSubmit}
        isPending={isPending}
      >
        <FormField label="Name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Kilogram"
          />
        </FormField>
        <FormField label="Symbol" required error={errors.symbol}>
          <Input
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            placeholder="e.g. kg"
          />
        </FormField>
        <FormField label="Decimal Places">
          <Input
            type="number"
            min={0}
            max={4}
            value={form.decimalPlaces}
            onChange={(e) =>
              setForm({ ...form, decimalPlaces: e.target.value })
            }
          />
        </FormField>
        <FormField label="Conversion Factor">
          <Input
            value={form.conversionFactor}
            onChange={(e) =>
              setForm({ ...form, conversionFactor: e.target.value })
            }
            placeholder="1"
          />
        </FormField>
        <FormField label="Is Base Unit">
          <Switch
            checked={form.isBaseUnit}
            onCheckedChange={(checked) =>
              setForm({ ...form, isBaseUnit: checked })
            }
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
