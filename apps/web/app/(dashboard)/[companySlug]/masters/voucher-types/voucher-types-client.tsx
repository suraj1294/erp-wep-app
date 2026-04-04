"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@workspace/ui/components/sonner"
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
import {
  createVoucherType,
  updateVoucherType,
  deleteVoucherType,
} from "@/lib/api/masters"

export interface VoucherTypeRow {
  id: string
  name: string
  code: string
  prefix: string | null
  voucherClass: string
  startingNumber: number | null
  currentNumber: number | null
  isActive: boolean | null
}

interface FormState {
  name: string
  code: string
  voucherClass: string
  prefix: string
  startingNumber: string
}

interface FormErrors {
  name?: string
  code?: string
  voucherClass?: string
}

interface VoucherTypesClientProps {
  companySlug: string
  initialVoucherTypes: VoucherTypeRow[]
}

const defaultForm: FormState = {
  name: "",
  code: "",
  voucherClass: "",
  prefix: "",
  startingNumber: "1",
}

const VOUCHER_CLASSES = [
  { value: "contra", label: "Contra" },
  { value: "payment", label: "Payment" },
  { value: "receipt", label: "Receipt" },
  { value: "journal", label: "Journal" },
  { value: "sales", label: "Sales" },
  { value: "purchase", label: "Purchase" },
  { value: "credit_note", label: "Credit Note" },
  { value: "debit_note", label: "Debit Note" },
]

export function VoucherTypesClient({
  companySlug,
  initialVoucherTypes,
}: VoucherTypesClientProps) {
  const router = useRouter()
  const [rows, setRows] = useState(initialVoucherTypes)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<VoucherTypeRow | null>(null)
  const [deleting, setDeleting] = useState<VoucherTypeRow | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setRows(initialVoucherTypes)
  }, [initialVoucherTypes])

  function openAdd() {
    setEditing(null)
    setForm(defaultForm)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(row: VoucherTypeRow) {
    setEditing(row)
    setForm({
      name: row.name,
      code: row.code,
      voucherClass: row.voucherClass,
      prefix: row.prefix ?? "",
      startingNumber: String(row.startingNumber ?? 1),
    })
    setErrors({})
    setDialogOpen(true)
  }

  function openDelete(row: VoucherTypeRow) {
    setDeleting(row)
    setDeleteOpen(true)
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.code.trim()) newErrors.code = "Code is required"
    if (!form.voucherClass) newErrors.voucherClass = "Voucher class is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    startTransition(async () => {
      try {
        const data = {
          name: form.name.trim(),
          code: form.code.trim(),
          voucherClass: form.voucherClass,
          prefix: form.prefix.trim() || undefined,
          startingNumber: parseInt(form.startingNumber, 10) || 1,
        }
        if (editing) {
          await updateVoucherType(companySlug, editing.id, data)
        } else {
          await createVoucherType(companySlug, data)
        }
        setDialogOpen(false)
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to save voucher type."
        )
      }
    })
  }

  function handleDeleteConfirm() {
    if (!deleting) return
    startTransition(async () => {
      try {
        const deletedId = deleting.id

        await deleteVoucherType(companySlug, deletedId)
        setRows((current) => current.filter((row) => row.id !== deletedId))
        setDeleting(null)
        setDeleteOpen(false)
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to delete voucher type."
        )
      }
    })
  }

  const columns = [
    { key: "name" as const, label: "Name" },
    { key: "code" as const, label: "Code" },
    { key: "voucherClass" as const, label: "Class" },
    { key: "prefix" as const, label: "Prefix" },
    { key: "startingNumber" as const, label: "Starting #" },
    {
      key: "isActive" as const,
      label: "Status",
      render: (value: unknown) => <StatusBadge active={value === true} />,
    },
  ]

  return (
    <>
      <MasterTable
        title="Voucher Types"
        rows={rows}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={openDelete}
        addLabel="Add Voucher Type"
      />

      <MasterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Voucher Type" : "Add Voucher Type"}
        onSubmit={handleSubmit}
        isPending={isPending}
      >
        <FormField label="Name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Sales Invoice"
          />
        </FormField>
        <FormField label="Code" required error={errors.code}>
          <Input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. SI"
          />
        </FormField>
        <FormField label="Voucher Class" required error={errors.voucherClass}>
          <Select
            value={form.voucherClass}
            onValueChange={(value) => setForm({ ...form, voucherClass: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {VOUCHER_CLASSES.map((vc) => (
                <SelectItem key={vc.value} value={vc.value}>
                  {vc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Prefix">
          <Input
            value={form.prefix}
            onChange={(e) => setForm({ ...form, prefix: e.target.value })}
            placeholder="e.g. INV-"
          />
        </FormField>
        <FormField label="Starting Number">
          <Input
            type="number"
            min={1}
            value={form.startingNumber}
            onChange={(e) =>
              setForm({ ...form, startingNumber: e.target.value })
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
