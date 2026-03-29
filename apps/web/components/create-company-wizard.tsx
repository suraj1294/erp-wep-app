"use client"

import { useMemo, useState } from "react"
import type { ComponentProps } from "react"
import { Button } from "@workspace/ui/components/button"
import { CardContent, CardFooter } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Separator } from "@workspace/ui/components/separator"
import { CreateCompanySubmitButton } from "@/components/create-company-submit-button"

type ActionProp = ComponentProps<"form">["action"]

type PartyDraft = {
  id: string
  name: string
  displayName: string
  type: "customer" | "supplier" | "both"
  phone: string
  email: string
}

type ItemDraft = {
  id: string
  name: string
  code: string
  salesRate: string
  purchaseRate: string
}

type LocationDraft = {
  id: string
  name: string
  code: string
  phone: string
}

const STEP_ORDER = ["company", "parties", "items", "locations"] as const
type StepKey = (typeof STEP_ORDER)[number]

const STEP_META: Record<
  StepKey,
  { title: string; description: string; optional: boolean }
> = {
  company: {
    title: "Company Details",
    description: "Add the basic company information required to get started.",
    optional: false,
  },
  parties: {
    title: "Parties",
    description: "Add customers or suppliers now, or skip and do it later.",
    optional: true,
  },
  items: {
    title: "Items",
    description: "Seed a few products or services up front if you want.",
    optional: true,
  },
  locations: {
    title: "Locations",
    description: "Set up warehouse or branch locations now, or skip this step.",
    optional: true,
  },
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function emptyParty(): PartyDraft {
  return {
    id: createId("party"),
    name: "",
    displayName: "",
    type: "customer",
    phone: "",
    email: "",
  }
}

function emptyItem(): ItemDraft {
  return {
    id: createId("item"),
    name: "",
    code: "",
    salesRate: "",
    purchaseRate: "",
  }
}

function emptyLocation(): LocationDraft {
  return {
    id: createId("location"),
    name: "",
    code: "",
    phone: "",
  }
}

function StepBadge({
  index,
  label,
  active,
  complete,
}: {
  index: number
  label: string
  active: boolean
  complete: boolean
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className={[
          "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : complete
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-muted text-muted-foreground",
        ].join(" ")}
      >
        {index + 1}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{label}</p>
      </div>
    </div>
  )
}

export function CreateCompanyWizard({ action }: { action: ActionProp }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [company, setCompany] = useState({
    name: "",
    displayName: "",
  })
  const [parties, setParties] = useState<PartyDraft[]>([emptyParty()])
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()])
  const [locations, setLocations] = useState<LocationDraft[]>([emptyLocation()])
  const [companyNameTouched, setCompanyNameTouched] = useState(false)

  const currentStep = STEP_ORDER[currentStepIndex]!
  const currentMeta = STEP_META[currentStep]
  const isLastStep = currentStepIndex === STEP_ORDER.length - 1
  const companyNameError =
    companyNameTouched && !company.name.trim() ? "Company name is required." : ""

  const partyPayload = useMemo(
    () =>
      JSON.stringify(
        parties
          .map((party) => ({
            name: party.name.trim(),
            displayName: party.displayName.trim(),
            type: party.type,
            phone: party.phone.trim(),
            email: party.email.trim(),
          }))
          .filter((party) => party.name)
      ),
    [parties]
  )

  const itemPayload = useMemo(
    () =>
      JSON.stringify(
        items
          .map((item) => ({
            name: item.name.trim(),
            code: item.code.trim(),
            salesRate: item.salesRate.trim(),
            purchaseRate: item.purchaseRate.trim(),
          }))
          .filter((item) => item.name)
      ),
    [items]
  )

  const locationPayload = useMemo(
    () =>
      JSON.stringify(
        locations
          .map((location) => ({
            name: location.name.trim(),
            code: location.code.trim(),
            phone: location.phone.trim(),
          }))
          .filter((location) => location.name)
      ),
    [locations]
  )

  function goNext() {
    if (currentStep === "company") {
      setCompanyNameTouched(true)
      if (!company.name.trim()) {
        return
      }
    }

    setCurrentStepIndex((index) => Math.min(index + 1, STEP_ORDER.length - 1))
  }

  function goBack() {
    setCurrentStepIndex((index) => Math.max(index - 1, 0))
  }

  function skipStep() {
    if (!currentMeta.optional) {
      return
    }
    goNext()
  }

  function updateParty(id: string, field: keyof PartyDraft, value: string) {
    setParties((current) =>
      current.map((party) => (party.id === id ? { ...party, [field]: value } : party))
    )
  }

  function updateItem(id: string, field: keyof ItemDraft, value: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    )
  }

  function updateLocation(id: string, field: keyof LocationDraft, value: string) {
    setLocations((current) =>
      current.map((location) =>
        location.id === id ? { ...location, [field]: value } : location
      )
    )
  }

  function renderCompanyStep() {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Company Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Acme Corporation"
            value={company.name}
            onChange={(event) =>
              setCompany((current) => ({ ...current, name: event.target.value }))
            }
            onBlur={() => setCompanyNameTouched(true)}
            required
          />
          {companyNameError && (
            <p className="text-sm text-destructive">{companyNameError}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayName">
            Display Name <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="displayName"
            name="displayName"
            type="text"
            placeholder="Acme Corp"
            value={company.displayName}
            onChange={(event) =>
              setCompany((current) => ({
                ...current,
                displayName: event.target.value,
              }))
            }
          />
        </div>
      </div>
    )
  }

  function renderPartiesStep() {
    return (
      <div className="space-y-4">
        {parties.map((party, index) => (
          <div key={party.id} className="rounded-lg border p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium">Party {index + 1}</p>
              {parties.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setParties((current) => current.filter((entry) => entry.id !== party.id))
                  }
                >
                  Remove
                </Button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Party Name</Label>
                <Input
                  value={party.name}
                  onChange={(event) => updateParty(party.id, "name", event.target.value)}
                  placeholder="Acme Customer"
                />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={party.displayName}
                  onChange={(event) =>
                    updateParty(party.id, "displayName", event.target.value)
                  }
                  placeholder="Acme"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-input/20 px-3 py-2 text-sm outline-none"
                  value={party.type}
                  onChange={(event) => updateParty(party.id, "type", event.target.value)}
                >
                  <option value="customer">Customer</option>
                  <option value="supplier">Supplier</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={party.phone}
                  onChange={(event) => updateParty(party.id, "phone", event.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Email</Label>
                <Input
                  value={party.email}
                  onChange={(event) => updateParty(party.id, "email", event.target.value)}
                  placeholder="billing@example.com"
                />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setParties((current) => [...current, emptyParty()])}>
          Add Another Party
        </Button>
      </div>
    )
  }

  function renderItemsStep() {
    return (
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="rounded-lg border p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium">Item {index + 1}</p>
              {items.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setItems((current) => current.filter((entry) => entry.id !== item.id))
                  }
                >
                  Remove
                </Button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  value={item.name}
                  onChange={(event) => updateItem(item.id, "name", event.target.value)}
                  placeholder="Standard Widget"
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={item.code}
                  onChange={(event) => updateItem(item.id, "code", event.target.value)}
                  placeholder="WGT-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Sales Rate</Label>
                <Input
                  value={item.salesRate}
                  onChange={(event) => updateItem(item.id, "salesRate", event.target.value)}
                  placeholder="120.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Purchase Rate</Label>
                <Input
                  value={item.purchaseRate}
                  onChange={(event) =>
                    updateItem(item.id, "purchaseRate", event.target.value)
                  }
                  placeholder="80.00"
                />
              </div>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setItems((current) => [...current, emptyItem()])}>
          Add Another Item
        </Button>
      </div>
    )
  }

  function renderLocationsStep() {
    return (
      <div className="space-y-4">
        {locations.map((location, index) => (
          <div key={location.id} className="rounded-lg border p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium">Location {index + 1}</p>
              {locations.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setLocations((current) =>
                      current.filter((entry) => entry.id !== location.id)
                    )
                  }
                >
                  Remove
                </Button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Location Name</Label>
                <Input
                  value={location.name}
                  onChange={(event) =>
                    updateLocation(location.id, "name", event.target.value)
                  }
                  placeholder="Main Warehouse"
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={location.code}
                  onChange={(event) =>
                    updateLocation(location.id, "code", event.target.value)
                  }
                  placeholder="WH-01"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Phone</Label>
                <Input
                  value={location.phone}
                  onChange={(event) =>
                    updateLocation(location.id, "phone", event.target.value)
                  }
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setLocations((current) => [...current, emptyLocation()])}
        >
          Add Another Location
        </Button>
      </div>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="name" value={company.name} />
      <input type="hidden" name="displayName" value={company.displayName} />
      <input type="hidden" name="parties" value={partyPayload} />
      <input type="hidden" name="items" value={itemPayload} />
      <input type="hidden" name="locations" value={locationPayload} />

      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-4">
          {STEP_ORDER.map((step, index) => (
            <StepBadge
              key={step}
              index={index}
              label={STEP_META[step].title}
              active={index === currentStepIndex}
              complete={index < currentStepIndex}
            />
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-lg font-semibold">{currentMeta.title}</p>
          <p className="text-sm text-muted-foreground">{currentMeta.description}</p>
        </div>

        {currentStep === "company" && renderCompanyStep()}
        {currentStep === "parties" && renderPartiesStep()}
        {currentStep === "items" && renderItemsStep()}
        {currentStep === "locations" && renderLocationsStep()}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={currentStepIndex === 0}
            className="flex-1 sm:flex-none"
          >
            Back
          </Button>
          {currentMeta.optional && !isLastStep && (
            <Button
              type="button"
              variant="ghost"
              onClick={skipStep}
              className="flex-1 sm:flex-none"
            >
              Skip
            </Button>
          )}
        </div>

        {!isLastStep ? (
          <Button type="button" onClick={goNext} className="w-full sm:w-auto">
            Next
          </Button>
        ) : (
          <CreateCompanySubmitButton
            idleLabel="Create Company"
            pendingLabel="Creating company..."
            className="w-full sm:w-auto"
          />
        )}
      </CardFooter>
    </form>
  )
}
