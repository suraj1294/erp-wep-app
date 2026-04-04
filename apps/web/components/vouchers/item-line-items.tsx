"use client"

import { useReducer, useCallback } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Delete01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { ItemCombobox, type ItemOption } from "./item-combobox"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ItemLine {
  itemId: string
  itemName: string
  description: string
  quantity: string
  rate: string
  taxRate: string
  unitSymbol: string
}

const EMPTY_LINE: ItemLine = {
  itemId: "",
  itemName: "",
  description: "",
  quantity: "1",
  rate: "",
  taxRate: "0",
  unitSymbol: "",
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type Action =
  | { type: "ADD_ROW" }
  | { type: "REMOVE_ROW"; index: number }
  | {
      type: "UPDATE_FIELD"
      index: number
      field: keyof ItemLine
      value: string
    }
  | {
      type: "SET_ITEM"
      index: number
      item: ItemOption
      rateField: "salesRate" | "purchaseRate"
    }

function reducer(state: ItemLine[], action: Action): ItemLine[] {
  switch (action.type) {
    case "ADD_ROW":
      return [...state, { ...EMPTY_LINE }]
    case "REMOVE_ROW":
      return state.filter((_, i) => i !== action.index)
    case "UPDATE_FIELD":
      return state.map((row, i) =>
        i === action.index ? { ...row, [action.field]: action.value } : row
      )
    case "SET_ITEM": {
      const rate =
        action.rateField === "salesRate"
          ? (action.item.salesRate ?? "")
          : (action.item.purchaseRate ?? "")
      return state.map((row, i) =>
        i === action.index
          ? {
              ...row,
              itemId: action.item.id,
              itemName: action.item.name,
              rate: rate ?? "",
              taxRate: action.item.taxRate ?? "0",
              unitSymbol: action.item.unitSymbol ?? "",
              quantity: row.quantity || "1",
            }
          : row
      )
    }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Hook — export so the parent form can use it
// ---------------------------------------------------------------------------

export function useItemLines(initial?: ItemLine[]) {
  return useReducer(reducer, initial ?? [{ ...EMPTY_LINE }])
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ItemLineItemsProps {
  lines: ItemLine[]
  dispatch: React.Dispatch<Action>
  itemOptions: ItemOption[]
  /** "salesRate" for sales/CN, "purchaseRate" for purchase/DN */
  rateField?: "salesRate" | "purchaseRate"
}

function lineAmount(line: ItemLine): string {
  const qty = parseFloat(line.quantity) || 0
  const rate = parseFloat(line.rate) || 0
  if (qty === 0 || rate === 0) return ""
  return (qty * rate).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function ItemLineItems({
  lines,
  dispatch,
  itemOptions,
  rateField = "salesRate",
}: ItemLineItemsProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Line Items</h2>
      </div>

      {/* Header */}
      <div className="hidden grid-cols-[2rem_1fr_1.5fr_5rem_6rem_5rem_6rem_2rem] gap-2 text-[10px] font-medium tracking-wider text-muted-foreground uppercase md:grid">
        <span>#</span>
        <span>Item</span>
        <span>Description</span>
        <span>Qty</span>
        <span>Rate</span>
        <span>Tax %</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1.5">
        {lines.map((line, i) => (
          <div
            key={i}
            className="grid grid-cols-[2rem_1fr_1.5fr_5rem_6rem_5rem_6rem_2rem] items-center gap-2"
          >
            {/* # */}
            <span className="text-center text-xs text-muted-foreground">
              {i + 1}
            </span>

            {/* Item */}
            <ItemCombobox
              options={itemOptions}
              value={line.itemId}
              onSelect={(item) =>
                dispatch({ type: "SET_ITEM", index: i, item, rateField })
              }
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

            {/* Qty */}
            <Input
              type="number"
              min="0"
              step="0.001"
              value={line.quantity}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_FIELD",
                  index: i,
                  field: "quantity",
                  value: e.target.value,
                })
              }
              className="text-right"
            />

            {/* Rate */}
            <Input
              type="number"
              min="0"
              step="0.01"
              value={line.rate}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_FIELD",
                  index: i,
                  field: "rate",
                  value: e.target.value,
                })
              }
              className="text-right"
            />

            {/* Tax % */}
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={line.taxRate}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_FIELD",
                  index: i,
                  field: "taxRate",
                  value: e.target.value,
                })
              }
              className="text-right"
            />

            {/* Amount (readonly) */}
            <div className="flex items-center justify-end">
              <span className="font-mono text-xs">{lineAmount(line)}</span>
            </div>

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={lines.length === 1}
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
        Add Line
      </Button>
    </div>
  )
}
