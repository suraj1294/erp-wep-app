"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Settings01Icon } from "@hugeicons/core-free-icons"
import type { SampleDataSeedProgress } from "@workspace/db"
import { toast } from "@workspace/ui/components/sonner"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
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
  seedSampleDataAction,
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
  sampleDataSeeded: boolean
  initialSampleDataSeedProgress: SampleDataSeedProgress | null
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

const SAMPLE_DATA_STEP_LABELS = [
  { key: "validate", label: "Validate company" },
  { key: "reference-data", label: "Load reference masters" },
  { key: "accounts", label: "Create supporting ledgers" },
  { key: "tax-rates", label: "Create tax rates" },
  { key: "locations", label: "Create extra locations" },
  { key: "parties", label: "Create parties and ledgers" },
  { key: "items", label: "Create items" },
  { key: "vouchers", label: "Post sample vouchers" },
  { key: "finalize", label: "Finalize seed" },
] as const

function getSeedStatusBadgeVariant(status: string) {
  if (status === "done" || status === "completed") return "default" as const
  if (status === "running") return "secondary" as const
  if (status === "error") return "destructive" as const
  return "outline" as const
}

function createOptimisticSeedProgress(): SampleDataSeedProgress {
  const timestamp = new Date().toISOString()

  return {
    status: "running",
    message: "Validating company for sample data.",
    currentStepKey: "validate",
    startedAt: timestamp,
    updatedAt: timestamp,
    steps: SAMPLE_DATA_STEP_LABELS.map((step) => ({
      ...step,
      status:
        step.key === "validate" ? ("running" as const) : ("pending" as const),
      detail: step.key === "validate" ? "Preparing seed workflow." : undefined,
    })),
  }
}

export function CompanySettingsClient({
  currentCompanySlug,
  companies,
  sampleDataSeeded,
  initialSampleDataSeedProgress,
}: CompanySettingsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [disableDialogOpen, setDisableDialogOpen] = useState(false)
  const [seedDialogOpen, setSeedDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyRow | null>(null)
  const [disablingCompany, setDisablingCompany] = useState<CompanyRow | null>(
    null
  )
  const [companyRows, setCompanyRows] = useState(companies)
  const [seedProgress, setSeedProgress] =
    useState<SampleDataSeedProgress | null>(initialSampleDataSeedProgress)
  const [isSeedingSampleData, setIsSeedingSampleData] = useState(false)
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

  useEffect(() => {
    setSeedProgress(initialSampleDataSeedProgress)
  }, [initialSampleDataSeedProgress])

  useEffect(() => {
    if (!isSeedingSampleData && seedProgress?.status !== "running") {
      return
    }

    let cancelled = false

    async function pollProgress() {
      const response = await fetch(
        `/${currentCompanySlug}/settings/sample-data-status`,
        {
          cache: "no-store",
          credentials: "same-origin",
        }
      )

      if (cancelled) {
        return
      }

      if (!response.ok) {
        return
      }

      const data = (await response.json()) as {
        sampleDataSeeded: boolean
        progress: SampleDataSeedProgress | null
      }

      setSeedProgress(data.progress)

      if (data.progress?.status !== "running") {
        setIsSeedingSampleData(false)
        router.refresh()
      }
    }

    void pollProgress()
    const intervalId = window.setInterval(() => {
      void pollProgress()
    }, 5000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [currentCompanySlug, isSeedingSampleData, router, seedProgress?.status])

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

  function submitSeedSampleData() {
    setSeedDialogOpen(false)
    setIsSeedingSampleData(true)
    setSeedProgress((current) => current ?? createOptimisticSeedProgress())

    void (async () => {
      const result = await seedSampleDataAction(currentCompanySlug)
      setSeedProgress(result.sampleDataSeedProgress ?? null)

      if (!result.ok) {
        setIsSeedingSampleData(
          result.sampleDataSeedProgress?.status === "running"
        )
        toast.error(result.message)
        return
      }

      setIsSeedingSampleData(
        result.sampleDataSeedProgress?.status === "running"
      )
      toast.success(result.message)
      router.refresh()
    })()
  }

  const currentCompany = companyRows.find(
    (company) => company.slug === currentCompanySlug
  )
  const canSeedSampleData =
    currentCompany?.role === "admin" || currentCompany?.role === "owner"
  const isSeedRunning =
    isSeedingSampleData || seedProgress?.status === "running"
  const effectiveSampleDataSeeded =
    sampleDataSeeded || seedProgress?.status === "completed"
  const sampleDataSteps = seedProgress?.steps?.length
    ? seedProgress.steps
    : SAMPLE_DATA_STEP_LABELS.map((step) => ({
        ...step,
        status: "pending" as const,
        detail: undefined,
      }))

  function submitCreate() {
    const nameError = validateName(createForm.name)
    setCreateErrors({ name: nameError })
    if (nameError) return

    startTransition(async () => {
      const result = await createCompanyFromSettings(
        currentCompanySlug,
        createForm
      )
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
              Manage company details, add a new company, or disable an existing
              one.
            </p>
          </div>
          <Button onClick={openCreate}>
            <HugeiconsIcon icon={Add01Icon} className="mr-2 size-4" />
            Add Company
          </Button>
        </CardHeader>
      </Card>

      <Card data-testid="sample-data-seed-card">
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
                        <div className="font-medium">
                          {company.displayName || company.name}
                        </div>
                        {company.displayName && (
                          <div className="text-xs text-muted-foreground">
                            {company.name}
                          </div>
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
                          disabled={
                            company.isActive !== true ||
                            company.role !== "owner"
                          }
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
            Owners can disable companies. Admins and owners can update company
            details.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Developer Tools</CardTitle>
          <p className="text-sm text-muted-foreground">
            Populate a fresh company with realistic demo masters and vouchers
            for testing.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">
                Seeds parties, items, tax rates, banking entries, journals, and
                all voucher types.
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  data-testid="sample-data-seed-status"
                  variant={getSeedStatusBadgeVariant(
                    (isSeedRunning ? "running" : null) ??
                      seedProgress?.status ??
                      (effectiveSampleDataSeeded ? "completed" : "pending")
                  )}
                >
                  {isSeedRunning
                    ? "Running"
                    : seedProgress?.status === "error"
                      ? "Failed"
                      : effectiveSampleDataSeeded
                        ? "Ready"
                        : "Not Started"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {(isSeedRunning && seedProgress?.message) ??
                    (isSeedRunning ? "Preparing sample data seed." : null) ??
                    seedProgress?.message ??
                    (effectiveSampleDataSeeded
                      ? "Sample data is already available for this company."
                      : "Run this once on a fresh company to populate realistic demo data.")}
                </span>
              </div>
            </div>
            <Button
              data-testid="sample-data-seed-button"
              variant="outline"
              onClick={() => setSeedDialogOpen(true)}
              disabled={
                !canSeedSampleData ||
                isPending ||
                isSeedRunning ||
                effectiveSampleDataSeeded
              }
            >
              {isSeedRunning
                ? "Seeding..."
                : effectiveSampleDataSeeded
                  ? "Already Seeded"
                  : "Seed Sample Data"}
            </Button>
          </div>

          <div className="grid gap-2 rounded-md border p-3">
            {sampleDataSteps.map((step) => (
              <div
                key={step.key}
                data-testid={`sample-data-step-${step.key}`}
                className="flex items-start justify-between gap-3 rounded-sm border border-transparent px-1 py-1"
              >
                <div className="space-y-1">
                  <div className="text-sm font-medium">{step.label}</div>
                  {step.detail ? (
                    <div className="text-xs text-muted-foreground">
                      {step.detail}
                    </div>
                  ) : null}
                </div>
                <Badge variant={getSeedStatusBadgeVariant(step.status)}>
                  {step.status === "done"
                    ? "Done"
                    : step.status === "running"
                      ? "Running"
                      : step.status === "error"
                        ? "Failed"
                        : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
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
        <FormField
          label="Company Name"
          required
          error={createErrors.name || undefined}
        >
          <Input
            value={createForm.name}
            onChange={(event) =>
              setCreateForm((current) => ({
                ...current,
                name: event.target.value,
              }))
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
        title={
          editingCompany
            ? `Edit ${editingCompany.displayName || editingCompany.name}`
            : "Edit Company"
        }
        onSubmit={submitEdit}
        isPending={isPending}
      >
        <FormField
          label="Company Name"
          required
          error={editErrors.name || undefined}
        >
          <Input
            value={editForm.name}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                name: event.target.value,
              }))
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
              setEditForm((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder="accounts@acme.com"
          />
        </FormField>
        <FormField label="Phone">
          <Input
            value={editForm.phone}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
            placeholder="+91 98765 43210"
          />
        </FormField>
        <FormField label="GSTIN">
          <Input
            value={editForm.gstin}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                gstin: event.target.value,
              }))
            }
            placeholder="22AAAAA0000A1Z5"
          />
        </FormField>
        <FormField label="PAN">
          <Input
            value={editForm.pan}
            onChange={(event) =>
              setEditForm((current) => ({
                ...current,
                pan: event.target.value,
              }))
            }
            placeholder="AAAAA0000A"
          />
        </FormField>
      </MasterDialog>

      <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disable &quot;
              {disablingCompany?.displayName || disablingCompany?.name || ""}
              &quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Disabled companies disappear from the active company flow and can
              no longer be opened.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitDisable}
              disabled={isPending}
              className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
            >
              {isPending ? "Disabling..." : "Disable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Seed sample data for this company?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will create demo parties, items, tax rates, and vouchers
              across the financial year.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitSeedSampleData}
              disabled={isPending}
            >
              {isPending ? "Seeding..." : "Seed Sample Data"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
