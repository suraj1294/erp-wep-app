"use client"

import { useReducer } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { AccountCombobox, type AccountOption } from "./account-combobox"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AccountLine {
  accountId: string
  accountName: string
  description: string
  /** For Template B (payment/receipt): the payment amount */
  amount: string
  /** For Template C (journal/contra): explicit debit */
  debitAmount: string
  /** For Template C (journal/contra): explicit credit */
  creditAmount: string
}

const EMPTY_LINE: AccountLine = {
  accountId: "",
  accountName: "",
  description: "",
  amount: "",
  debitAmount: "",
  creditAmount: "",
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type Action =
  | { type: "ADD_ROW" }
  | { type: "REMOVE_ROW"; index: number }
  | { type: "UPDATE_FIELD"; index: number; field: keyof AccountLine; value: string }
  | { type: "SET_ACCOUNT"; index: number; account: AccountOption }
  | { type: "SET_DEBIT"; index: number; value: string }
  | { type: "SET_CREDIT"; index: number; value: string }

function reducer(state: AccountLine[], action: Action): AccountLine[] {
  switch (action.type) {
    case "ADD_ROW":
      return [...state, { ...EMPTY_LINE }]
    case "REMOVE_ROW":
      return state.filter((_, i) => i !== action.index)
    case "UPDATE_FIELD":
      return state.map((row, i) =>
        i === action.index ? { ...row, [action.field]: action.value } : row
      )
    case "SET_ACCOUNT":
      return state.map((row, i) =>
        i === action.index
          ? { ...row, accountId: action.account.id, accountName: action.account.name }
          : row
      )
    // Debit and credit are mutually exclusive per row (for journal/contra)
    case "SET_DEBIT":
      return state.map((row, i) =>
        i === action.index
          ? { ...row, debitAmount: action.value, creditAmount: action.value ? "" : row.creditAmount }
          : row
      )
    case "SET_CREDIT":
      return state.map((row, i) =>
        i === action.index
          ? { ...row, creditAmount: action.value, debitAmount: action.value ? "" : row.debitAmount }
          : row
      )
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAccountLines(initial?: AccountLine[]) {
  return useReducer(reducer, initial ?? [{ ...EMPTY_LINE }, { ...EMPTY_LINE }])
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AccountLineItemsProps {
  lines: AccountLine[]
  dispatch: React.Dispatch<Action>
  accountOptions: AccountOption[]
  /**
   * "payment" | "receipt" — show single Amount column
   * "journal" | "contra"  — show Debit + Credit columns
   */
  mode: "payment" | "receipt" | "journal" | "contra"
}

export function AccountLineItems({
  lines,
  dispatch,
  accountOptions,
  mode,
}: AccountLineItemsProps) {
  const isJournal = mode === "journal" || mode === "contra"

  const totalDebit = isJournal
    ? lines.reduce((s, l) => s + (parseFloat(l.debitAmount) || 0), 0)
    : 0
  const totalCredit = isJournal
    ? lines.reduce((s, l) => s + (parseFloat(l.creditAmount) || 0), 0)
    : 0
  const totalAmount = !isJournal
    ? lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0)
    : 0
  const balanced = isJournal && Math.abs(totalDebit - totalCredit) < 0.005

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium">
        {isJournal ? "Ledger Entries" : "Line Items"}
      </h2>

      {/* Column headers */}
      {isJournal ? (
        <div className="hidden grid-cols-[2rem_1fr_1.5fr_7rem_7rem_2rem] gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:grid">
          <span>#</span>
          <span>Account</span>
          <span>Description</span>
          <span className="text-right">Debit</span>
          <span className="text-right">Credit</span>
          <span />
        </div>
      ) : (
        <div className="hidden grid-cols-[2rem_1fr_1.5fr_8rem_2rem] gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:grid">
          <span>#</span>
          <span>Account</span>
          <span>Description</span>
          <span className="text-right">Amount</span>
          <span />
        </div>
      )}

      {/* Rows */}
      <div className="flex flex-col gap-1.5">
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              "grid items-center gap-2",
              isJournal
                ? "grid-cols-[2rem_1fr_1.5fr_7rem_7rem_2rem]"
                : "grid-cols-[2rem_1fr_1.5fr_8rem_2rem]"
            )}
          >
            {/* # */}
            <span className="text-center text-xs text-muted-foreground">{i + 1}</span>

            {/* Account */}
            <AccountCombobox
              options={accountOptions}
              value={line.accountId}
              onSelect={(acc) => dispatch({ type: "SET_ACCOUNT", index: i, account: acc })}
            />

            {/* Description */}
            <Input
              value={line.description}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_FIELD",
                  index: i,
                  field: "description",
                  value: e.target.value,
                })
              }
              placeholder="Description"
            />

            {isJournal ? (
              <>
                {/* Debit */}
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.debitAmount}
                  onChange={(e) =>
                    dispatch({ type: "SET_DEBIT", index: i, value: e.target.value })
                  }
                  placeholder="0.00"
                  className="text-right"
                />
                {/* Credit */}
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.creditAmount}
                  onChange={(e) =>
                    dispatch({ type: "SET_CREDIT", index: i, value: e.target.value })
                  }
                  placeholder="0.00"
                  className="text-right"
                />
              </>
            ) : (
              /* Amount */
              <Input
                type="number"
                min="0"
                step="0.01"
                value={line.amount}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_FIELD",
                    index: i,
                    field: "amount",
                    value: e.target.value,
                  })
                }
                placeholder="0.00"
                className="text-right"
              />
            )}

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={lines.length <= (isJournal ? 2 : 1)}
              onClick={() => dispatch({ type: "REMOVE_ROW", index: i })}
              aria-label="Remove line"
              className="text-muted-foreground hover:text-destructive"
            >
              <HugeiconsIcon icon={Delete01Icon} className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-1 w-fit"
        onClick={() => dispatch({ type: "ADD_ROW" })}
      >
        <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
        Add Entry
      </Button>

      {/* Balance indicator for journal/contra */}
      {isJournal && (
        <div className="flex items-center justify-end gap-6 text-xs">
          <span>
            Total Debit:{" "}
            <span className="font-mono font-medium">
              ₹{" "}
              {totalDebit.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </span>
          <span>
            Total Credit:{" "}
            <span className="font-mono font-medium">
              ₹{" "}
              {totalCredit.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </span>
          {(totalDebit > 0 || totalCredit > 0) && (
            <span
              className={cn(
                "font-medium",
                balanced ? "text-green-600" : "text-destructive"
              )}
            >
              {balanced
                ? "✓ Balanced"
                : `Difference: ₹ ${Math.abs(totalDebit - totalCredit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
            </span>
          )}
        </div>
      )}

      {/* Total for payment/receipt */}
      {!isJournal && totalAmount > 0 && (
        <div className="flex justify-end text-xs">
          <span>
            Total:{" "}
            <span className="font-mono font-medium">
              ₹{" "}
              {totalAmount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
