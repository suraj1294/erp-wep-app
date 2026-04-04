"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@workspace/ui/components/sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { VoucherFormShell } from "./voucher-form-shell"
import { VoucherHeader } from "./voucher-header"
import { ItemLineItems, useItemLines } from "./item-line-items"
import { VoucherSummary, computeSummary } from "./voucher-summary"
import {
  LedgerEntriesPreview,
  buildItemLedgerPreview,
} from "./ledger-entries-preview"
import type { PartyOption } from "./party-combobox"
import type { AccountOption } from "./account-combobox"
import type { ItemOption } from "./item-combobox"
import { createVoucher, updateVoucher } from "@/lib/api/vouchers"
import type { ItemVoucherInitialValues } from "@/lib/voucher-edit"

export interface VoucherTypeOption {
  id: string
  name: string
  prefix: string | null
  currentNumber: number
}

interface ItemVoucherFormProps {
  companySlug: string
  voucherClass: "sales" | "purchase" | "credit_note" | "debit_note"
  voucherTypes: VoucherTypeOption[]
  parties: PartyOption[]
  items: ItemOption[]
  /** All accounts — used for ledger preview account name lookup */
  accounts: AccountOption[]
  backHref: string
  title: string
  listHref: string
  voucherId?: string
  mode?: "create" | "edit"
  initialValues?: ItemVoucherInitialValues
}

function previewNumber(vt: VoucherTypeOption): string {
  const padded = String(vt.currentNumber).padStart(4, "0")
  return vt.prefix ? `${vt.prefix}-${padded}` : padded
}

const today = new Date().toISOString().slice(0, 10)
const ITEM_CLASSES_USING_SALES_RATE = ["sales", "credit_note"]

export function ItemVoucherForm({
  companySlug,
  voucherClass,
  voucherTypes,
  parties,
  items,
  accounts,
  backHref,
  title,
  listHref,
  voucherId,
  mode = "create",
  initialValues,
}: ItemVoucherFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const isEditMode = mode === "edit"

  // Header state
  const [voucherTypeId, setVoucherTypeId] = useState(
    initialValues?.voucherTypeId ?? voucherTypes[0]?.id ?? ""
  )
  const [voucherDate, setVoucherDate] = useState(
    initialValues?.voucherDate ?? today
  )
  const [referenceNumber, setReferenceNumber] = useState(
    initialValues?.referenceNumber ?? ""
  )
  const [partyId, setPartyId] = useState(initialValues?.partyId ?? "")
  const [partyName, setPartyName] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? "")
  const [narration, setNarration] = useState(initialValues?.narration ?? "")

  // Line items state
  const rateField = ITEM_CLASSES_USING_SALES_RATE.includes(voucherClass)
    ? "salesRate"
    : "purchaseRate"
  const [lines, dispatch] = useItemLines(
    initialValues?.lines.length ? initialValues.lines : undefined
  )

  // Computed summary
  const parsedLines = useMemo(
    () =>
      lines.map((l) => ({
        quantity: parseFloat(l.quantity) || 0,
        rate: parseFloat(l.rate) || 0,
        taxRate: parseFloat(l.taxRate) || 0,
      })),
    [lines]
  )
  const { subtotal, taxGroups, grandTotal } = useMemo(
    () => computeSummary(parsedLines),
    [parsedLines]
  )

  // Ledger entries preview
  const selectedVt = voucherTypes.find((vt) => vt.id === voucherTypeId)
  const ledgerEntries = useMemo(() => {
    const linesWithName = lines.map((l, i) => ({
      itemName: l.itemName,
      quantity: parsedLines[i]?.quantity ?? 0,
      rate: parsedLines[i]?.rate ?? 0,
      taxRate: parsedLines[i]?.taxRate ?? 0,
    }))
    return buildItemLedgerPreview({
      voucherClass,
      partyName,
      lines: linesWithName,
    })
  }, [voucherClass, partyName, lines, parsedLines])

  function validate(): string | null {
    if (!voucherTypeId) return "Please select a voucher type."
    if (!voucherDate) return "Date is required."
    if (!partyId) return "Party is required."
    const hasLine = lines.some(
      (l) =>
        l.itemId &&
        (parseFloat(l.quantity) || 0) > 0 &&
        (parseFloat(l.rate) || 0) > 0
    )
    if (!hasLine)
      return "At least one line with item, quantity, and rate is required."
    return null
  }

  function buildInput() {
    return {
      voucherTypeId,
      voucherClass,
      voucherDate,
      referenceNumber: referenceNumber || undefined,
      partyId: partyId || undefined,
      narration: narration || undefined,
      dueDate: dueDate || undefined,
      itemLines: lines
        .filter((l) => l.itemId && parseFloat(l.quantity) > 0)
        .map((l) => ({
          itemId: l.itemId,
          description: l.description,
          quantity: parseFloat(l.quantity),
          rate: parseFloat(l.rate),
          taxRate: parseFloat(l.taxRate) || 0,
        })),
    }
  }

  function resetForm() {
    setVoucherDate(today)
    setReferenceNumber("")
    setPartyId("")
    setPartyName(null)
    setDueDate("")
    setNarration("")
    dispatch({ type: "REMOVE_ROW", index: 0 })
    dispatch({ type: "ADD_ROW" })
  }

  async function handleSave(saveAndNew = false) {
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }

    if (isSaving) {
      return
    }

    setIsSaving(true)

    try {
      const result =
        isEditMode && voucherId
          ? await updateVoucher(companySlug, voucherId, buildInput())
          : await createVoucher(companySlug, buildInput())

      toast.success(
        isEditMode
          ? `Voucher ${result.voucherNumber} updated.`
          : `Voucher ${result.voucherNumber} saved.`
      )

      if (saveAndNew && !isEditMode) {
        resetForm()
        setIsSaving(false)
        return
      }

      window.location.assign(listHref)
    } catch (err) {
      setIsSaving(false)
      toast.error(
        err instanceof Error ? err.message : "Failed to save voucher."
      )
    }
  }

  return (
    <VoucherFormShell
      title={title}
      backHref={backHref}
      backLabel={`Back to ${title}`}
      narration={narration}
      onNarrationChange={setNarration}
      onSave={() => void handleSave(false)}
      onSaveAndNew={isEditMode ? undefined : () => void handleSave(true)}
      onCancel={() => router.push(listHref)}
      isPending={isSaving}
      saveLabel={isEditMode ? "Save Changes" : "Save"}
      footer={
        <div className="flex flex-col gap-4">
          <VoucherSummary
            subtotal={subtotal}
            taxGroups={taxGroups}
            total={grandTotal}
            showTaxBreakdown
          />
          <LedgerEntriesPreview entries={ledgerEntries} />
        </div>
      }
    >
      {/* Voucher type selector */}
      {voucherTypes.length > 1 && !isEditMode && (
        <div className="flex max-w-xs flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Voucher Type
          </label>
          <Select value={voucherTypeId} onValueChange={setVoucherTypeId}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {voucherTypes.map((vt) => (
                <SelectItem key={vt.id} value={vt.id}>
                  {vt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <VoucherHeader
        voucherClass={voucherClass}
        voucherNumber={
          initialValues?.voucherNumber ??
          (selectedVt ? previewNumber(selectedVt) : "—")
        }
        voucherDate={voucherDate}
        onVoucherDateChange={setVoucherDate}
        referenceNumber={referenceNumber}
        onReferenceNumberChange={setReferenceNumber}
        partyId={partyId}
        onPartyChange={(party) => {
          setPartyId(party.id)
          setPartyName(party.displayName ?? party.name)
        }}
        parties={parties}
        dueDate={dueDate}
        onDueDateChange={setDueDate}
        balancingAccountId=""
        onBalancingAccountChange={() => {}}
        cashBankAccounts={[]}
      />

      <ItemLineItems
        lines={lines}
        dispatch={dispatch}
        itemOptions={items}
        rateField={rateField}
      />
    </VoucherFormShell>
  )
}
