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

export interface ItemOption {
  id: string
  name: string
  code: string | null
  salesRate: string | null
  purchaseRate: string | null
  taxRate: string | null
  unitSymbol: string | null
}

interface ItemComboboxProps {
  options: ItemOption[]
  value: string // itemId or ""
  onSelect: (item: ItemOption) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ItemCombobox({
  options,
  value,
  onSelect,
  placeholder = "Search items…",
  disabled,
  className,
}: ItemComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.id === value)

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
          <span className="truncate">
            {selected ? selected.name : placeholder}
          </span>
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
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.name} ${option.code ?? ""}`}
                  data-checked={value === option.id}
                  onSelect={() => {
                    onSelect(option)
                    setOpen(false)
                  }}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{option.name}</span>
                    {option.code && (
                      <span className="text-[10px] text-muted-foreground">
                        {option.code}
                        {option.unitSymbol ? ` · ${option.unitSymbol}` : ""}
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
