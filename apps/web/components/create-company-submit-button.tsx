"use client"

import { Button } from "@workspace/ui/components/button"

interface CreateCompanySubmitButtonProps {
  idleLabel?: string
  pendingLabel?: string
  className?: string
  pending?: boolean
}

export function CreateCompanySubmitButton({
  idleLabel = "Create Company",
  pendingLabel = "Creating...",
  className = "w-full",
  pending = false,
}: CreateCompanySubmitButtonProps) {
  return (
    <Button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  )
}
