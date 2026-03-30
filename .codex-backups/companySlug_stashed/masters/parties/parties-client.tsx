"use client"

import { useState, useTransition } from "react"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
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
import { createParty, updateParty, deleteParty } from "./actions"

export interface PartyRow {
  id: string
  name: string
  displayName: string | null
  type: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  gstin: string | null
  isActive: boolean | null
}

interface FormState {
  name: string
  displayName: string
  type: string
  contactPerson: string
  phone: string
  email: string
  gstin: string
  pan: string
  creditLimit: string
  creditDays: string
}

interface FormErrors {
  name?: string
  type?: string
}

interface PartiesClientProps {
  companySlug: string
  initialParties: PartyRow[]
}

const defaultForm: FormState = {
  name: "",
  displayName: "",
  type: "",
  contactPerson: "",
  phone: "",
  email: "",
  gstin: "",
  pan: "",
  creditLimit: "0",
  creditDays: "0",
}

function PartyTypeBadge({ type }: { type: string }) {
  if (type === "customer") {
    return (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200">
        Customer
      </Badge>
    )
  }
  if (type === "supplier") {
    return (
      <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200">
        Supplier
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-teal-500/10 text-teal-600 border-teal-200">
      Both
    </Badge>
  )
}

export function PartiesClient({
  companySlug,
  initialParties,
}: PartiesClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<PartyRow | null>(null)
  const [deleting, setDeleting] = useState<PartyRow | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setEditing(null)
    setForm(defaultForm)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(row: PartyRow) {
    setEditing(row)
    setForm({
      name: row.name,
      displayName: row.displayName ?? "",
      type: row.type,
      contactPerson: row.contactPerson ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      gstin: row.gstin ?? "",
      pan: "",
      creditLimit: "0",
      creditDays: "0",
    })
    setErrors({})
    setDialogOpen(true)
  }

  function openDelete(row: PartyRow) {
    setDeleting(row)
    setDeleteOpen(true)
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.type) newErrors.type = "Type is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    startTransition(async () => {
      const data = {
        name: form.name.trim(),
        displayName: form.displayName.trim() || undefined,
        type: form.type,
        contactPerson: form.contactPerson.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        gstin: form.gstin.trim() || undefined,
        pan: form.pan.trim() || undefined,
        creditLimit: form.creditLimit || "0",
        creditDays: parseInt(form.creditDays, 10) || 0,
      }
      if (editing) {
        await updateParty(companySlug, editing.id, data)
      } else {
        await createParty(companySlug, data)
      }
      setDialogOpen(false)
    })
  }

  function handleDeleteConfirm() {
    if (!deleting) return
    startTransition(async () => {
      await deleteParty(companySlug, deleting.id)
      setDeleteOpen(false)
    })
  }

  const columns = [
    { key: "name" as const, label: "Name" },
    {
      key: "type" as const,
      label: "Type",
      render: (value: unknown) => <PartyTypeBadge type={value as string} />,
    },
    { key: "phone" as const, label: "Phone" },
    { key: "email" as const, label: "Email" },
    { key: "gstin" as const, label: "GSTIN" },
    {
      key: "isActive" as const,
      label: "Status",
      render: (value: unknown) => <StatusBadge active={value === true} />,
    },
  ]

  return (
    <>
      <MasterTable
        title="Parties"
        rows={initialParties}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={openDelete}
        addLabel="Add Party"
      />

      <MasterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Party" : "Add Party"}
        onSubmit={handleSubmit}
        isPending={isPending}
      >
        <FormField label="Name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Party name"
          />
        </FormField>
        <FormField label="Display Name">
          <Input
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            placeholder="Display name (optional)"
          />
        </FormField>
        <FormField label="Type" required error={errors.type}>
          <Select
            value={form.type}
            onValueChange={(value) => setForm({ ...form, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
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
        <FormField label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email address"
          />
        </FormField>
        <FormField label="GSTIN">
          <Input
            value={form.gstin}
            onChange={(e) => setForm({ ...form, gstin: e.target.value })}
            placeholder="GST Identification Number"
          />
        </FormField>
        <FormField label="PAN">
          <Input
            value={form.pan}
            onChange={(e) => setForm({ ...form, pan: e.target.value })}
            placeholder="PAN Number"
          />
        </FormField>
        <FormField label="Credit Limit">
          <Input
            type="number"
            value={form.creditLimit}
            onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
            placeholder="0.00"
          />
        </FormField>
        <FormField label="Credit Days">
          <Input
            type="number"
            value={form.creditDays}
            onChange={(e) => setForm({ ...form, creditDays: e.target.value })}
            placeholder="0"
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
