"use client"

import { type ReactNode, useEffect, useState } from "react"
import { Input } from "@workspace/ui/components/input"

interface ReportToolbarProps {
  searchPlaceholder?: string
  initialSearch?: string
  onSearchChange: (value: string) => void
  children?: ReactNode
}

export function ReportToolbar({
  searchPlaceholder = "Search...",
  initialSearch = "",
  onSearchChange,
  children,
}: ReportToolbarProps) {
  const [search, setSearch] = useState(initialSearch)

  useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onSearchChange(search.trim())
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [onSearchChange, search])

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="w-full sm:max-w-sm">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      {children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  )
}
