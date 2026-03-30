"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Settings01Icon } from "@hugeicons/core-free-icons"
import { toast } from "@workspace/ui/components/sonner"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { MasterDialog } from "@/components/masters/master-dialog"
import { FormField } from "@/components/masters/form-field"
import { StatusBadge } from "@/components/masters/status-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import {
  createCompanyFromSettings,
  disableManagedCompany,
  updateManagedCompany,
} from "./actions"

interface CompanyRow {
  id: string
  slug: string
  name: string
  displayName: string | null
  email: string | null
  phone: string | null
  gstin: string | null
  pan: string | null
  isActive: boolean | null
  role: string
}

interface CompanySettingsClientProps {
  currentCompanySlug: string
  companies: CompanyRow[]
}

interface CompanyFormState {
  name: string
  displayName: string
  email: string
  phone: string
  gstin: string
  pan: string
}

const emptyCreateForm = {
  name: "",
  displayName: "",
}

const emptyErrors = {
  name: "",
}

export function CompanySettingsClient({
  currentCompanySlug,
  companies,
}: CompanySettingsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [disableDialogOpen, setDisableDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyRow | null>(null)
  const [disablingCompany, setDisablingCompany] = useState<CompanyRow | null>(null)
  const [companyRows, setCompanyRows] = useState(companies)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [createErrors, setCreateErrors] = useState(emptyErrors)
  const [editForm, setEditForm] = useState<CompanyFormState>({
    name: "",
    displayName: "",
    email: "",
    phone: "",
    gstin: "",
    pan: "",
  })
  const [editErrors, setEditErrors] = useState(emptyErrors)

  useEffect(() => {
    setCompanyRows(companies)
  }, [companies])

  function validateName(name: string) {
    return name.trim() ? "" : "Company name is required"
  }

  function openCreate() {
    setCreateForm(emptyCreateForm)
    setCreateErrors(emptyErrors)
    setCreateDialogOpen(true)
  }

  function openEdit(company: CompanyRow) {
    setEditingCompany(company)
    setEditForm({
      name: company.name,
      displayName: company.displayName ?? "",
      email: company.email ?? "",
      phone: company.phone ?? "",
      gstin: company.gstin ?? "",
      pan: company.pan ?? "",
    })
    setEditErrors(emptyErrors)
    setEditDialogOpen(true)
  }

  function openDisable(company: CompanyRow) {
    setDisablingCompany(company)
    setDisableDialogOpen(true)
  }

  function submitCreate() {
    const nameError = validateName(createForm.name)
    setCreateErrors({ name: nameError })
    if (nameError) return

    startTransition(async () => {
      const result = await createCompanyFromSettings(currentCompanySlug, createForm)
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      setCreateDialogOpen(false)
      toast.success(result.message)
      router.refresh()
    })
  }

  function submitEdit() {
    if (!editingCompany) return

    const nameError = validateName(editForm.name)
    setEditErrors({ name: nameError })
    if (nameError) return

    startTransition(async () => {
      const result = await updateManagedCompany(
        currentCompanySlug,
        editingCompany.id,
        editForm
      )
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      setCompanyRows((current) =>
        current.map((company) =>
          company.id === editingCompany.id
            ? {
                ...company,
                name: editForm.name.trim(),
                displayName: editForm.displayName.trim() || null,
                email: editForm.email.trim() || null,
                phone: editForm.phone.trim() || null,
                gstin: editForm.gstin.trim() || null,
                pan: editForm.pan.trim() || null,
              }
            : company
        )
      )
      setEditDialogOpen(false)
      toast.success(result.message)
      router.refresh()
    })
  }

  function submitDisable() {
    if (!disablingCompany) return

    startTransition(async () => {
      const result = await disableManagedCompany(
        currentCompanySlug,
        disablingCompany.id
      )
      if (!result.ok) {
        toast.error(result.message)
        return
      }

      setDisableDialogOpen(false)
      toast.success(result.message)

      setCompanyRows((current) =>
        current.map((company) =>
          company.id === disablingCompany.id
            ? { ...company, isActive: false }
            : company
        )
      )

      if (result.redirectCompanySlug) {
        router.push(`/${result.redirectCompanySlug}/settings`)
        router.refresh()
        return
      }

      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Settings01Icon} className="size-5" />
              Company Settings
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage company details, add a new company, or disable an existing one.
            </p>
          </div>
          <Button onClick={openCreate}>
            <HugeiconsIcon icon={Add01Icon} className="mr-2 size-4" />
            Add Company
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyRows.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="font-medium">{company.displayName || company.name}</div>
                        {company.displayName && (
                          <div className="text-xs text-muted-foreground">{company.name}</div>
                        )}
                        {company.slug === currentCompanySlug && (
                          <Badge variant="outline" className="w-fit">
                            Current
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <span>{company.email || "No email"}</span>
                        <span className="text-muted-foreground">
                          {company.phone || "No phone"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <span>{company.gstin || "No GSTIN"}</span>
                        <span className="text-muted-foreground">
                          {company.pan || "No PAN"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {company.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge active={company.isActive === true} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(company)}
                          disabled={company.role === "viewer"}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDisable(company)}
                          disabled={company.isActive !== true || company.role !== "owner"}
                        >
                          Disable
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Owners can disable companies. Admins and owners can update company details.
          </p>
        </CardContent>
      </Card>

      <MasterDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Add Company"
        description="Create a new company and seed its default masters."
        onSubmit={submitCreate}
        isPending={isPending}
      >
        <FormField label="Company Name" required error={createErrors.name || undefined}>
          <Input
            value={createForm.name}
            onChange={(event) =>
              setCreateForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Acme Corporation"
          />
        </FormField>
        <FormField label="Display Name">
          <Input
            value={createForm.displayName}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                displayName: event.target.value,
              }))
            }
            placeholder="Acme Corp"
          />
        </FormField>
      </MasterDialog>

      <MasterDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title={editingCompany ? `Edit ${editingCompany.displayName || editingCompany.name}` : "Edit Company"}
        onSubmit={submitEdit}
        isPending={isPending}
      >
        <FormField label="Company Name" required error={editErrors.name || undefined}>
          <Input
            value={editForm.name}
            onChange={(event) =>
              setEditForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Acme Corporation"
          />
        </FormField>
        <FormField label="Display Name">
          <Input
            value={editForm.displayName}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                displayName: event.target.value,
              }))
            }
            placeholder="Acme Corp"
          />
        </FormField>
        <FormField label="Email">
          <Input
            value={editForm.email}
            onChange={(event) =>
              setEditForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="accounts@acme.com"
          />
        </FormField>
        <FormField label="Phone">
          <Input
            value={editForm.phone}
            onChange={(event) =>
              setEditForm((current) => ({ ...current, phone: event.target.value }))
            }
            placeholder="+91 98765 43210"
          />
        </FormField>
        <FormField label="GSTIN">
          <Input
            value={editForm.gstin}
            onChange={(event) =>
              setEditForm((current) => ({ ...current, gstin: event.target.value }))
            }
            placeholder="22AAAAA0000A1Z5"
          />
        </FormField>
        <FormField label="PAN">
          <Input
            value={editForm.pan}
            onChange={(event) =>
              setEditForm((current) => ({ ...current, pan: event.target.value }))
            }
            placeholder="AAAAA0000A"
          />
        </FormField>
      </MasterDialog>

      <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disable &quot;{disablingCompany?.displayName || disablingCompany?.name || ""}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Disabled companies disappear from the active company flow and can no longer be opened.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitDisable}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Disabling..." : "Disable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
