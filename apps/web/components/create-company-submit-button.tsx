"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@workspace/ui/components/button"

interface CreateCompanySubmitButtonProps {
  idleLabel?: string
  pendingLabel?: string
  className?: string
}

export function CreateCompanySubmitButton({
  idleLabel = "Create Company",
  pendingLabel = "Creating...",
  className = "w-full",
}: CreateCompanySubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  )
}
