import type { ReactNode } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

interface SummaryCardProps {
  title: string
  value: string
  description?: string
  icon?: ReactNode
}

export function SummaryCard({
  title,
  value,
  description,
  icon,
}: SummaryCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="text-xl tabular-nums">{value}</CardTitle>
          </div>
          {icon ? (
            <div className="text-muted-foreground" aria-hidden="true">
              {icon}
            </div>
          ) : null}
        </div>
      </CardHeader>
      {description ? (
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      ) : null}
    </Card>
  )
}
