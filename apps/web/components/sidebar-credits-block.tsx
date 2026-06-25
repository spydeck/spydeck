"use client"

import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useApifyUsage, useScrapeCreatorsCredits } from "@/lib/credits"
import { useSettings } from "@/lib/settings"

function CreditRow({
  label,
  loading,
  error,
  value,
  percent,
}: {
  label: string
  loading: boolean
  error: boolean
  value: string | null
  percent: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        {loading ? (
          <Skeleton className="h-3 w-14" />
        ) : (
          <span className="text-muted-foreground">{error ? "—" : value}</span>
        )}
      </div>
      {!error && <Progress value={loading ? 0 : percent} className="h-1.5" />}
    </div>
  )
}

function ScrapeCreatorsRow() {
  const { data, isPending, isError } = useScrapeCreatorsCredits()
  return (
    <CreditRow
      label="ScrapeCreators"
      loading={isPending}
      error={isError}
      value={data ? `${data.remaining.toLocaleString()} credits` : null}
      // ponytail: API exposes only remaining credits, no plan total — bar is a presence indicator
      percent={100}
    />
  )
}

function ApifyRow() {
  const { data, isPending, isError } = useApifyUsage()
  const percent =
    data && data.limit > 0
      ? Math.max(0, Math.min(100, (data.remaining / data.limit) * 100))
      : 0
  return (
    <CreditRow
      label="Apify"
      loading={isPending}
      error={isError}
      value={data ? `$${data.remaining.toFixed(2)} / $${data.limit.toFixed(2)}` : null}
      percent={percent}
    />
  )
}

export function SidebarCreditsBlock() {
  const { data: settings } = useSettings()
  const scConfigured = Boolean(settings?.scrapeCreatorsKey)
  const apifyConfigured = Boolean(settings?.apifyKey)

  if (!scConfigured && !apifyConfigured) return null

  return (
    <div className="flex flex-col gap-3 px-2 py-2">
      {scConfigured && <ScrapeCreatorsRow />}
      {apifyConfigured && <ApifyRow />}
    </div>
  )
}
