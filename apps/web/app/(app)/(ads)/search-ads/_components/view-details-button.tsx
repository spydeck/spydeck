"use client"

import { EyeIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function ViewDetailsButton({
  externalId,
  persisted,
  onView,
}: {
  externalId: string
  persisted?: boolean
  onView?: (externalId: string) => void
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="View ad details"
      title={persisted ? "View details" : "No details yet — use Fetch details"}
      onClick={() => onView?.(externalId)}
      className={cn("size-8", persisted && "text-primary")}
    >
      <EyeIcon className="size-4" />
    </Button>
  )
}
