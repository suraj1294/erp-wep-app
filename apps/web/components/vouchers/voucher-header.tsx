"use client"

import { Input } from "@workspace/ui/components/input"
import { PartyCombobox, type PartyOption } from "./party-combobox"
import { AccountCombobox, type AccountOption } from "./account-combobox"

interface VoucherHeaderProps {
  /** e.g. "sales" | "purchase" | "payment" | "receipt" | "contra" | "journal" | "credit_note" | "debit_note" */
  voucherClass: string
  voucherNumber: string // readonly, auto-assigned
  voucherDate: string
  onVoucherDateChange: (value: string) => void
  referenceNumber: string
  onReferenceNumberChange: (value: string) => void
  // Party (sales / purchase / CN / DN)
  partyId: string
  onPartyChange: (party: PartyOption) => void
  parties: PartyOption[]
  // Due date (sales / purchase / CN / DN)
  dueDate: string
  onDueDateChange: (value: string) => void
  // Balancing account (payment / receipt)
  balancingAccountId: string
  onBalancingAccountChange: (account: AccountOption) => void
  cashBankAccounts: AccountOption[]
}

const ITEM_CLASSES = ["sales", "purchase", "credit_note", "debit_note"]
const BANKING_CLASSES = ["payment", "receipt"]

export function VoucherHeader({
  voucherClass,
  voucherNumber,
  voucherDate,
  onVoucherDateChange,
  referenceNumber,
  onReferenceNumberChange,
  partyId,
  onPartyChange,
  parties,
  dueDate,
  onDueDateChange,
  balancingAccountId,
  onBalancingAccountChange,
  cashBankAccounts,
}: VoucherHeaderProps) {
  const isItemBased = ITEM_CLASSES.includes(voucherClass)
  const isBanking = BANKING_CLASSES.includes(voucherClass)
  const balancingLabel =
    voucherClass === "payment" ? "Pay From" : "Receive Into"

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
      {/* Voucher # — always shown, readonly */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Voucher #
        </label>
        <Input value={voucherNumber} readOnly className="bg-muted/30 font-mono" />
      </div>

      {/* Date — always shown */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Date <span className="text-destructive">*</span>
        </label>
        <Input
          type="date"
          value={voucherDate}
          onChange={(e) => onVoucherDateChange(e.target.value)}
        />
      </div>

      {/* Reference # — always shown */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Reference #
        </label>
        <Input
          value={referenceNumber}
          onChange={(e) => onReferenceNumberChange(e.target.value)}
          placeholder="e.g. PO-001"
        />
      </div>

      {/* Pay From / Receive Into — payment & receipt only */}
      {isBanking && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {balancingLabel} <span className="text-destructive">*</span>
          </label>
          <AccountCombobox
            options={cashBankAccounts}
            value={balancingAccountId}
            onSelect={onBalancingAccountChange}
            placeholder={`Select ${balancingLabel.toLowerCase()}…`}
          />
        </div>
      )}

      {/* Party — item-based and journal (optional for journal) */}
      {(isItemBased || voucherClass === "journal") && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Party{isItemBased ? <span className="text-destructive"> *</span> : " (optional)"}
          </label>
          <PartyCombobox
            options={parties}
            value={partyId}
            onSelect={onPartyChange}
            placeholder="Search party…"
          />
        </div>
      )}

      {/* Due date — item-based only */}
      {isItemBased && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Due Date
          </label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
