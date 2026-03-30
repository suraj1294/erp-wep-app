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
import {
  createAccountGroup,
  updateAccountGroup,
  deleteAccountGroup,
} from "./actions"

export interface GroupRow {
  id: string
  name: string
  code: string | null
  accountType: string
  nature: string
  level: number | null
  parentId: string | null
  isSystem: boolean | null
  isActive: boolean | null
}

interface FormState {
  name: string
  code: string
  accountType: string
  nature: string
  parentId: string
}

interface FormErrors {
  name?: string
  accountType?: string
  nature?: string
}

interface AccountGroupsClientProps {
  companySlug: string
  initialGroups: GroupRow[]
}

const defaultForm: FormState = {
  name: "",
  code: "",
  accountType: "",
  nature: "",
  parentId: "",
}

export function AccountGroupsClient({
  companySlug,
  initialGroups,
}: AccountGroupsClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState<GroupRow | null>(null)
  const [deleting, setDeleting] = useState<GroupRow | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setEditing(null)
    setForm(defaultForm)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(row: GroupRow) {
    setEditing(row)
    setForm({
      name: row.name,
      code: row.code ?? "",
      accountType: row.accountType,
      nature: row.nature,
      parentId: row.parentId ?? "",
    })
    setErrors({})
    setDialogOpen(true)
  }

  function openDelete(row: GroupRow) {
    setDeleting(row)
    setDeleteOpen(true)
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.accountType) newErrors.accountType = "Account type is required"
    if (!form.nature) newErrors.nature = "Nature is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    startTransition(async () => {
      const data = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        accountType: form.accountType,
        nature: form.nature,
        parentId: form.parentId || null,
      }
      if (editing) {
        await updateAccountGroup(companySlug, editing.id, data)
      } else {
        await createAccountGroup(companySlug, data)
      }
      setDialogOpen(false)
    })
  }

  function handleDeleteConfirm() {
    if (!deleting) return
    startTransition(async () => {
      await deleteAccountGroup(companySlug, deleting.id)
      setDeleteOpen(false)
    })
  }

  const parentOptions = initialGroups.filter(
    (g) => editing === null || g.id !== editing.id
  )

  const columns = [
    { key: "name" as const, label: "Name" },
    { key: "code" as const, label: "Code" },
    { key: "accountType" as const, label: "Account Type" },
    { key: "nature" as const, label: "Nature" },
    {
      key: "isSystem" as const,
      label: "Type",
      render: (value: unknown) =>
        value ? (
          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
            System
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Custom
          </Badge>
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
        title="Account Groups"
        rows={initialGroups}
        columns={columns}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={openDelete}
        addLabel="Add Group"
      />

      <MasterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Account Group" : "Add Account Group"}
        onSubmit={handleSubmit}
        isPending={isPending}
      >
        <FormField label="Name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Current Assets"
          />
        </FormField>
        <FormField label="Code">
          <Input
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. CA"
          />
        </FormField>
        <FormField label="Account Type" required error={errors.accountType}>
          <Select
            value={form.accountType}
            onValueChange={(value) => setForm({ ...form, accountType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asset">Asset</SelectItem>
              <SelectItem value="liability">Liability</SelectItem>
              <SelectItem value="equity">Equity</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Nature" required error={errors.nature}>
          <Select
            value={form.nature}
            onValueChange={(value) => setForm({ ...form, nature: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select nature" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="debit">Debit</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Parent Group">
          <Select
            value={form.parentId || "none"}
            onValueChange={(value) =>
              setForm({ ...form, parentId: value === "none" ? "" : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {parentOptions.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
