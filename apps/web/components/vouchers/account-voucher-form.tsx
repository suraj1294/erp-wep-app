"use client"

import { useState, useTransition, useMemo } from "react"
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
import { AccountLineItems, useAccountLines } from "./account-line-items"
import type { PartyOption } from "./party-combobox"
import type { AccountOption } from "./account-combobox"
import { createVoucher } from "@/app/(dashboard)/[companyId]/vouchers/actions"
import type { VoucherTypeOption } from "./item-voucher-form"

interface AccountVoucherFormProps {
  companyId: string
  voucherClass: "payment" | "receipt" | "journal" | "contra"
  voucherTypes: VoucherTypeOption[]
  parties: PartyOption[]
  /** All accounts — for journal/contra line items */
  accounts: AccountOption[]
  /** Cash & bank accounts only — for payment/receipt balancing account */
  cashBankAccounts: AccountOption[]
  backHref: string
  title: string
  listHref: string
}

function previewNumber(vt: VoucherTypeOption): string {
  const padded = String(vt.currentNumber).padStart(4, "0")
  return vt.prefix ? `${vt.prefix}-${padded}` : padded
}

const today = new Date().toISOString().slice(0, 10)

export function AccountVoucherForm({
  companyId,
  voucherClass,
  voucherTypes,
  parties,
  accounts,
  cashBankAccounts,
  backHref,
  title,
  listHref,
}: AccountVoucherFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const mode = voucherClass as "payment" | "receipt" | "journal" | "contra"

  // Header state
  const [voucherTypeId, setVoucherTypeId] = useState(
    voucherTypes[0]?.id ?? ""
  )
  const [voucherDate, setVoucherDate] = useState(today)
  const [referenceNumber, setReferenceNumber] = useState("")
  const [partyId, setPartyId] = useState("")
  const [balancingAccountId, setBalancingAccountId] = useState("")
  const [narration, setNarration] = useState("")

  // Line items state
  const [lines, dispatch] = useAccountLines()

  const selectedVt = voucherTypes.find((vt) => vt.id === voucherTypeId)
  const isJournal = voucherClass === "journal" || voucherClass === "contra"
  const isBanking = voucherClass === "payment" || voucherClass === "receipt"

  // Total for payment/receipt
  const total = useMemo(
    () => lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0),
    [lines]
  )

  // Balance check for journal/contra
  const totalDebit = useMemo(
    () => lines.reduce((s, l) => s + (parseFloat(l.debitAmount) || 0), 0),
    [lines]
  )
  const totalCredit = useMemo(
    () => lines.reduce((s, l) => s + (parseFloat(l.creditAmount) || 0), 0),
    [lines]
  )

  function validate(): string | null {
    if (!voucherTypeId) return "Please select a voucher type."
    if (!voucherDate) return "Date is required."
    if (isBanking && !balancingAccountId)
      return `${voucherClass === "payment" ? "Pay From" : "Receive Into"} account is required.`
    const hasLine = lines.some((l) => {
      if (isJournal) {
        return (
          l.accountId &&
          ((parseFloat(l.debitAmount) || 0) > 0 ||
            (parseFloat(l.creditAmount) || 0) > 0)
        )
      }
      return l.accountId && (parseFloat(l.amount) || 0) > 0
    })
    if (!hasLine) return "At least one line with account and amount is required."
    if (isJournal && Math.abs(totalDebit - totalCredit) > 0.005)
      return `Entries are not balanced. Difference: ₹ ${Math.abs(totalDebit - totalCredit).toFixed(2)}`
    if (lines.length < 2 && isJournal)
      return "At least 2 entries are required for journal/contra."
    return null
  }

  function handleSave(saveAndNew = false) {
    const err = validate()
    if (err) {
      toast.error(err)
      return
    }
    startTransition(async () => {
      try {
        const accountLines = lines
          .filter((l) => l.accountId)
          .map((l) => ({
            accountId: l.accountId,
            description: l.description,
            amount: parseFloat(l.amount) || 0,
            debitAmount: isJournal ? parseFloat(l.debitAmount) || 0 : parseFloat(l.amount) || 0,
            creditAmount: isJournal ? parseFloat(l.creditAmount) || 0 : 0,
          }))

        const result = await createVoucher(companyId, {
          voucherTypeId,
          voucherClass,
          voucherDate,
          referenceNumber: referenceNumber || undefined,
          partyId: partyId || undefined,
          narration: narration || undefined,
          accountLines,
          balancingAccountId: balancingAccountId || undefined,
        })
        toast.success(`Voucher ${result.voucherNumber} saved.`)
        if (saveAndNew) {
          setVoucherDate(today)
          setReferenceNumber("")
          setPartyId("")
          setBalancingAccountId("")
          setNarration("")
          dispatch({ type: "REMOVE_ROW", index: 0 })
          if (isJournal) dispatch({ type: "REMOVE_ROW", index: 0 })
          dispatch({ type: "ADD_ROW" })
          if (isJournal) dispatch({ type: "ADD_ROW" })
        } else {
          router.push(listHref)
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to save voucher."
        )
      }
    })
  }

  // Line items for journal/contra use all accounts; for payment/receipt exclude balancing account
  const lineAccountOptions =
    voucherClass === "contra"
      ? cashBankAccounts
      : accounts

  return (
    <VoucherFormShell
      title={title}
      backHref={backHref}
      backLabel={`Back to ${title}`}
      narration={narration}
      onNarrationChange={setNarration}
      onSave={() => handleSave(false)}
      onSaveAndNew={() => handleSave(true)}
      onCancel={() => router.push(listHref)}
      isPending={isPending}
    >
      {/* Voucher type selector */}
      {voucherTypes.length > 1 && (
        <div className="flex flex-col gap-1 max-w-xs">
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
        voucherNumber={selectedVt ? previewNumber(selectedVt) : "—"}
        voucherDate={voucherDate}
        onVoucherDateChange={setVoucherDate}
        referenceNumber={referenceNumber}
        onReferenceNumberChange={setReferenceNumber}
        partyId={partyId}
        onPartyChange={(p) => setPartyId(p.id)}
        parties={parties}
        dueDate=""
        onDueDateChange={() => {}}
        balancingAccountId={balancingAccountId}
        onBalancingAccountChange={(acc) => setBalancingAccountId(acc.id)}
        cashBankAccounts={cashBankAccounts}
      />

      <AccountLineItems
        lines={lines}
        dispatch={dispatch}
        accountOptions={lineAccountOptions}
        mode={mode}
      />
    </VoucherFormShell>
  )
}
