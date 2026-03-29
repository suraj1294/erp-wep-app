"use client"

import { Badge } from "@workspace/ui/components/badge"

interface StatusBadgeProps {
  active: boolean
}

export function StatusBadge({ active }: StatusBadgeProps) {
  if (active) {
    return (
      <Badge
        variant="outline"
        className="bg-green-500/10 text-green-600 border-green-200"
      >
        Active
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Inactive
    </Badge>
  )
}
