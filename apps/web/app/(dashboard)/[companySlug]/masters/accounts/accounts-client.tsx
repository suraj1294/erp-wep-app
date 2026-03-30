"use client"

import { useState, useTransition } from "react"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
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
import { createAccount, updateAccount, deleteAccount } from "./actions"

export interface AccountRow {
  id: string
  name: string
  code: string | null
  description: string | null
  groupId: string | null
  openingBalance: string | null
  currentBalance: string | null
  isSystem: boolean | null
  isActive: boolean | null
}

export interface GroupRow {
  id: string
  name: string
}

interface FormState {
  name: string
  code: string
  description: string
  groupId: string
  openingBalance: string
}

interface FormErrors {
  name?: string
}

interface AccountsClientProps {
  companySlug: string
  initialAccounts: AccountRow[]
  accountGroups: GroupRow[]
}

const defaultForm: FormState = {
  name: "",
  code: "",
  description: "",
  groupId: "",
  openingBalance: "0",
}

export function AccountsClient({
  companySlug,
  initialAccounts,
  accountGroups,
}: AccountsClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<AccountRow | null>(null)
  const [deleting, setDeleting] = useState<AccountRow | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setEditing(null)
    setForm(defaultForm)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(row: AccountRow) {
    setEditing(row)
    setForm({
      name: row.name,
      code: row.code ?? "",
      description: row.description ?? "",
      groupId: row.groupId ?? "",
      openingBalance: row.openingBalance ?? "0",
    })
    setErrors({})
    setDialogOpen(true)
  }

  function openDelete(row: AccountRow) {
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
        description: form.description.trim() || undefined,
        groupId: form.groupId || null,
        openingBalance: form.openingBalance || "0",
      }
      if (editing) {
        await updateAccount(companySlug, editing.id, data)
      } else {
        await createAccount(companySlug, data)
      }
      setDialogOpen(false)
    })
  }

  function handleDeleteConfirm() {
    if (!deleting) return
    startTransition(async () => {
      await deleteAccount(companySlug, deleting.id)
      setDeleteOpen(false)
    })
  }

  function getGroupName(groupId: string | null): string {
    if (!groupId) return "—"
    return accountGroups.find((g) => g.id === groupId)?.name ?? "—"
  }

  const columns = [
    { key: "name" as const, label: "Name" },
    { key: "code" as const, label: "Code" },
    {
      key: "groupId" as const,
      label: "Group",
      render: (value: unknown) => getGroupName(value as string | null),
    },
    { key: "openingBalance" as const, label: "Opening Balance" },
    {
      key: "isActive" as const,
      label: "Status",
      render: (value: unknown) => <StatusBadge active={value === true} />,
    },
  ]

  return (
    <>
      <MasterTable
        title="Accounts (Ledgers)"
        rows={initialAccounts}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={openDelete}
        addLabel="Add Account"
      />

      <MasterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Account" : "Add Account"}
        onSubmit={handleSubmit}
        isPending={isPending}
      >
        <FormField label="Name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Cash in Hand"
          />
        </FormField>
        <FormField label="Code">
          <Input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. CASH001"
          />
        </FormField>
        <FormField label="Account Group">
          <Select
            value={form.groupId || "none"}
            onValueChange={(value) =>
              setForm({ ...form, groupId: value === "none" ? "" : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="No Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Group</SelectItem>
              {accountGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Opening Balance">
          <Input
            type="number"
            value={form.openingBalance}
            onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
            placeholder="0.00"
          />
        </FormField>
        <FormField label="Description">
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
            rows={3}
          />
        </FormField>
      </MasterDialog>

      <MasterDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        name={deleting?.name ?? ""}
        isSystem={deleting?.isSystem ?? false}
        onConfirm={handleDeleteConfirm}
        isPending={isPending}
      />
    </>
  )
}
