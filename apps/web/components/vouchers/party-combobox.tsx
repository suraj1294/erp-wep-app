"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface PartyOption {
  id: string
  name: string
  displayName: string | null
  type: string // "customer" | "supplier" | "both"
  accountId: string | null
  gstin?: string | null
}

interface PartyComboboxProps {
  options: PartyOption[]
  value: string // partyId or ""
  onSelect: (party: PartyOption) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function PartyCombobox({
  options,
  value,
  onSelect,
  placeholder = "Search parties…",
  disabled,
  className,
}: PartyComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.id === value)
  const displayName = selected
    ? (selected.displayName ?? selected.name)
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">{displayName}</span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="ml-2 size-3 shrink-0 opacity-50"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>No parties found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.name} ${option.displayName ?? ""} ${option.gstin ?? ""}`}
                  data-checked={value === option.id}
                  onSelect={() => {
                    onSelect(option)
                    setOpen(false)
                  }}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">
                      {option.displayName ?? option.name}
                    </span>
                    {option.gstin && (
                      <span className="text-[10px] text-muted-foreground">
                        GSTIN: {option.gstin}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
