"use client"

import { useState, useTransition } from "react"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Switch } from "@workspace/ui/components/switch"
import { Badge } from "@workspace/ui/components/badge"
import { MasterTable } from "@/components/masters/master-table"
import { MasterDialog } from "@/components/masters/master-dialog"
import { MasterDeleteDialog } from "@/components/masters/master-delete-dialog"
import { FormField } from "@/components/masters/form-field"
import { StatusBadge } from "@/components/masters/status-badge"
import { createLocation, updateLocation, deleteLocation } from "./actions"

export interface LocationRow {
  id: string
  name: string
  code: string | null
  address: string | null
  contactPerson: string | null
  phone: string | null
  isDefault: boolean | null
  isActive: boolean | null
}

interface FormState {
  name: string
  code: string
  address: string
  contactPerson: string
  phone: string
  isDefault: boolean
}

interface FormErrors {
  name?: string
}

interface LocationsClientProps {
  companyId: string
  initialLocations: LocationRow[]
}

const defaultForm: FormState = {
  name: "",
  code: "",
  address: "",
  contactPerson: "",
  phone: "",
  isDefault: false,
}

export function LocationsClient({ companyId, initialLocations }: LocationsClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<LocationRow | null>(null)
  const [deleting, setDeleting] = useState<LocationRow | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setEditing(null)
    setForm(defaultForm)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(row: LocationRow) {
    setEditing(row)
    setForm({
      name: row.name,
      code: row.code ?? "",
      address: row.address ?? "",
      contactPerson: row.contactPerson ?? "",
      phone: row.phone ?? "",
      isDefault: row.isDefault ?? false,
    })
    setErrors({})
    setDialogOpen(true)
  }

  function openDelete(row: LocationRow) {
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
        address: form.address.trim() || undefined,
        contactPerson: form.contactPerson.trim() || undefined,
        phone: form.phone.trim() || undefined,
        isDefault: form.isDefault,
      }
      if (editing) {
        await updateLocation(companyId, editing.id, data)
      } else {
        await createLocation(companyId, data)
      }
      setDialogOpen(false)
    })
  }

  function handleDeleteConfirm() {
    if (!deleting) return
    startTransition(async () => {
      await deleteLocation(companyId, deleting.id)
      setDeleteOpen(false)
    })
  }

  const columns = [
    { key: "name" as const, label: "Name" },
    { key: "code" as const, label: "Code" },
    { key: "contactPerson" as const, label: "Contact Person" },
    { key: "phone" as const, label: "Phone" },
    {
      key: "isDefault" as const,
      label: "Default",
      render: (value: unknown) =>
        value ? (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
            Yes
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">No</span>
        ),
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
        title="Locations"
        rows={initialLocations}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={openDelete}
        addLabel="Add Location"
      />

      <MasterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Location" : "Add Location"}
        onSubmit={handleSubmit}
        isPending={isPending}
      >
        <FormField label="Name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Main Warehouse"
          />
        </FormField>
        <FormField label="Code">
          <Input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. WH001"
          />
        </FormField>
        <FormField label="Address">
          <Textarea
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Enter full address"
            rows={3}
          />
        </FormField>
        <FormField label="Contact Person">
          <Input
            value={form.contactPerson}
            onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
            placeholder="Contact person name"
          />
        </FormField>
        <FormField label="Phone">
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Phone number"
          />
        </FormField>
        <FormField label="Set as Default">
          <Switch
            checked={form.isDefault}
            onCheckedChange={(checked) => setForm({ ...form, isDefault: checked })}
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
