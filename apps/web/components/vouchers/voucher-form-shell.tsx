"use client"

import Link from "next/link"
import { useTransition } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

interface VoucherFormShellProps {
  title: string
  backHref: string
  backLabel: string
  narration: string
  onNarrationChange: (value: string) => void
  onSave: () => void
  onSaveAndNew?: () => void
  onCancel: () => void
  isPending?: boolean
  saveLabel?: string
  children: React.ReactNode
  /** Optional extra content between line items and footer (e.g. summary, ledger preview) */
  footer?: React.ReactNode
}

export function VoucherFormShell({
  title,
  backHref,
  backLabel,
  narration,
  onNarrationChange,
  onSave,
  onSaveAndNew,
  onCancel,
  isPending = false,
  saveLabel = "Save",
  children,
  footer,
}: VoucherFormShellProps) {
  return (
    <div className="flex flex-col gap-0">
      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={backHref}>
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
              <span className="sr-only">{backLabel}</span>
            </Link>
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          {onSaveAndNew && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveAndNew}
              disabled={isPending}
            >
              Save & New
            </Button>
          )}
          <Button size="sm" onClick={onSave} disabled={isPending}>
            {isPending ? "Saving…" : saveLabel}
          </Button>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* ── Form body (header fields + line items) ─────────────────── */}
      <div className="flex flex-col gap-6">{children}</div>

      {/* ── Narration ──────────────────────────────────────────────── */}
      <div className="mt-6">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Narration
        </label>
        <Textarea
          value={narration}
          onChange={(e) => onNarrationChange(e.target.value)}
          placeholder="Optional description / memo"
          rows={2}
          className="resize-none"
        />
      </div>

      {/* ── Footer slot (summary, ledger preview, etc.) ────────────── */}
      {footer && <div className="mt-6">{footer}</div>}

      {/* ── Bottom action buttons ──────────────────────────────────── */}
      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <div className="flex gap-2">
          {onSaveAndNew && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveAndNew}
              disabled={isPending}
            >
              Save & New
            </Button>
          )}
          <Button size="sm" onClick={onSave} disabled={isPending}>
            {isPending ? "Saving…" : saveLabel}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
