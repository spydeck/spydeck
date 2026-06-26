"use client"

import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { toAdDetailRequest, type NormalizedAd } from "./normalized-ad"

interface AdDetailRow {
  platform: string
  externalId: string
  sourceUrl: string | null
  detail: unknown
  fetchedAt: string
}

// Noisy / internal fields not worth showing.
const SKIP_KEYS = new Set(["success", "credits_remaining", "creditsRemaining", "id", "raw"])

// Render order for the common ad fields; everything else follows in payload order.
const PRIORITY = [
  "image", "video", "carouselImages", "cover", "thumbnail",
  "headline", "title", "ad_title", "name",
  "advertiser", "poster", "brand_name", "page_name", "advertiserName",
  "description", "body", "text", "cta",
  "adType", "format", "creativeType",
  "totalImpressions", "impressions", "like", "ctr", "cost",
  "adDuration", "startDate", "endDate", "firstShown", "lastShown",
  "targeting", "impressionsByCountry",
  "destinationUrl", "landingPage", "url", "adUrl", "advertiserLinkedinPage",
]

function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim()
}

function isUrl(v: string): boolean {
  return /^https?:\/\//i.test(v)
}

function isEmpty(v: unknown): boolean {
  if (v == null || v === "") return true
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === "object") return Object.keys(v as object).length === 0
  return false
}

function sortedEntries(obj: Record<string, unknown>): [string, unknown][] {
  return Object.entries(obj)
    .filter(([k, v]) => !SKIP_KEYS.has(k) && !isEmpty(v))
    .sort(([a], [b]) => {
      const ia = PRIORITY.indexOf(a)
      const ib = PRIORITY.indexOf(b)
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
    })
}

function DetailValue({ keyName, value }: { keyName: string; value: unknown }) {
  if (typeof value === "string") {
    if (/(image|cover|thumbnail|avatar|logo|picture|carousel)/i.test(keyName) && isUrl(value)) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="max-h-72 w-full rounded-md border bg-muted object-contain"
        />
      )
    }
    if (/video/i.test(keyName) && isUrl(value)) {
      return (
        <video
          src={value}
          controls
          className="max-h-72 w-full rounded-md border bg-muted"
        />
      )
    }
    if (isUrl(value)) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm break-all text-primary hover:underline"
        >
          {value}
        </a>
      )
    }
    return <p className="text-sm whitespace-pre-wrap text-foreground">{value}</p>
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <p className="text-sm text-foreground">{String(value)}</p>
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-col gap-2">
        {value.map((item, i) =>
          item !== null && typeof item === "object" ? (
            <DetailObject key={i} obj={item as Record<string, unknown>} />
          ) : (
            <DetailValue key={i} keyName={keyName} value={item} />
          )
        )}
      </div>
    )
  }

  if (value && typeof value === "object") {
    return <DetailObject obj={value as Record<string, unknown>} />
  }

  return null
}

function Field({ keyName, value }: { keyName: string; value: unknown }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {humanizeKey(keyName)}
      </span>
      <DetailValue keyName={keyName} value={value} />
    </div>
  )
}

function DetailObject({ obj }: { obj: Record<string, unknown> }) {
  const entries = sortedEntries(obj)
  if (entries.length === 0) return null
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
      {entries.map(([k, v]) => (
        <Field key={k} keyName={k} value={v} />
      ))}
    </div>
  )
}

export function AdDetailSidebar({
  ad,
  onClose,
}: {
  ad: NormalizedAd | null
  onClose: () => void
}) {
  const req = ad ? toAdDetailRequest(ad) : null

  const { data, isLoading, isError } = useQuery({
    queryKey: ["ad-detail", req?.platform, req?.externalId],
    queryFn: () =>
      apiFetch<AdDetailRow>(`/sync/ad-details/${req!.platform}/${req!.externalId}`),
    enabled: !!req,
    retry: false,
  })

  const detail = data?.detail
  const entries =
    detail && typeof detail === "object" && !Array.isArray(detail)
      ? sortedEntries(detail as Record<string, unknown>)
      : []

  return (
    <Sheet
      open={!!ad}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="truncate">
            {ad?.headline || ad?.advertiser || "Ad detail"}
          </SheetTitle>
          <SheetDescription>
            {[ad?.advertiser, ad?.platform].filter(Boolean).join(" · ")}
            {data ? ` · fetched ${new Date(data.fetchedAt).toLocaleString()}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          {isLoading && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {isError && (
            <p className="text-sm text-muted-foreground">
              No details persisted for this ad yet. Select it and click{" "}
              <span className="font-medium text-foreground">Fetch details</span>.
            </p>
          )}

          {data && (
            <>
              {data.sourceUrl && (
                <a
                  href={data.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open original ad
                </a>
              )}
              {entries.length > 0 ? (
                entries.map(([k, v]) => <Field key={k} keyName={k} value={v} />)
              ) : (
                <p className="text-sm text-muted-foreground">
                  No detail fields available.
                </p>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
