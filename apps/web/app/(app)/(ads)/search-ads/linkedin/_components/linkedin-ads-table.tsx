"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { AdThumbnail } from "../../_components/ad-thumbnail"
import { SaveAdButton } from "../../_components/save-ad-button"
import { ViewDetailsButton } from "../../_components/view-details-button"
import { differenceInCalendarDays, isValid, parseISO } from "date-fns"
import { normalizeLinkedInAd, type LinkedInAd } from "./linkedin-ad"

// Inclusive run length in days when both start/end dates are set, else 0.
function durationDays(ad: LinkedInAd): number {
  if (ad.startDate && ad.endDate) {
    const start = parseISO(ad.startDate)
    const end = parseISO(ad.endDate)
    if (isValid(start) && isValid(end)) {
      return differenceInCalendarDays(end, start) + 1
    }
  }
  return 0
}

function formatDuration(ad: LinkedInAd): string {
  const days = durationDays(ad)
  if (days > 0) return `${days} ${days === 1 ? "day" : "days"}`
  return ad.adDuration ?? "–"
}

function impressionsSortKey(value: LinkedInAd["totalImpressions"]): {
  bucket: number
  num: number
  str: string
} {
  if (value == null || value === "") return { bucket: 2, num: 0, str: "" }
  if (typeof value === "number") return { bucket: 0, num: value, str: "" }
  return { bucket: 1, num: 0, str: value }
}

function renderImpressions(value: LinkedInAd["totalImpressions"]): string {
  if (value == null || value === "") return "–"
  if (typeof value === "number") return value.toLocaleString()
  return value
}

export function LinkedInAdsTable({
  ads,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onViewDetails,
  persistedIds,
}: {
  ads: LinkedInAd[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[], checked: boolean) => void
  onViewDetails?: (externalId: string) => void
  persistedIds?: Set<string>
}) {
  const columns = useMemo<ColumnDef<LinkedInAd>[]>(() => {
    const allSelected = ads.length > 0 && ads.every((a) => selectedIds.has(a.id))
    const someSelected = ads.some((a) => selectedIds.has(a.id))
    return [
      {
        id: "select",
        enableSorting: false,
        enableResizing: false,
        size: 44,
        header: () => (
          <Checkbox
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            aria-label="Select all ads"
            onCheckedChange={(checked) =>
              onSelectAll(ads.map((a) => a.id), checked === true)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            aria-label="Select ad"
            onCheckedChange={() => onToggleSelect(row.original.id)}
          />
        ),
      },
      {
        id: "advertiser",
        accessorFn: (ad) => ad.advertiser || ad.poster || "",
        size: 220,
        minSize: 140,
        header: "Advertiser",
        cell: ({ row }) => {
          const name = row.original.advertiser || row.original.poster || "Advertiser"
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-8 rounded-md">
                <AvatarFallback className="rounded-md bg-muted text-xs font-semibold">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{name}</span>
            </div>
          )
        },
      },
      {
        id: "headline",
        accessorFn: (ad) => ad.headline ?? "",
        size: 320,
        minSize: 160,
        header: "Headline",
        cell: ({ row }) => (
          <p className="line-clamp-1 max-w-md font-medium text-foreground">
            {row.original.headline || "–"}
          </p>
        ),
      },
      {
        id: "adType",
        accessorFn: (ad) => ad.adType ?? "",
        size: 160,
        minSize: 120,
        header: "Ad type",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.adType || "–"}</span>
        ),
      },
      {
        id: "impressions",
        accessorFn: (ad) => impressionsSortKey(ad.totalImpressions),
        size: 140,
        minSize: 110,
        header: "Impressions",
        sortingFn: (a, b, columnId) => {
          const av = a.getValue<{ bucket: number; num: number; str: string }>(columnId)
          const bv = b.getValue<{ bucket: number; num: number; str: string }>(columnId)
          if (av.bucket !== bv.bucket) return av.bucket - bv.bucket
          if (av.bucket === 0) return av.num - bv.num
          if (av.bucket === 1) return av.str.localeCompare(bv.str)
          return 0
        },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {renderImpressions(row.original.totalImpressions)}
          </span>
        ),
      },
      {
        id: "duration",
        accessorFn: (ad) => durationDays(ad),
        size: 180,
        minSize: 140,
        header: "Duration",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDuration(row.original)}
          </span>
        ),
      },
      {
        id: "thumbnail",
        enableSorting: false,
        size: 96,
        minSize: 72,
        header: "Thumbnail",
        cell: ({ row }) => <AdThumbnail ad={normalizeLinkedInAd(row.original)} />,
      },
      {
        id: "actions",
        enableSorting: false,
        enableResizing: false,
        size: 88,
        header: () => null,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <ViewDetailsButton
              externalId={row.original.id}
              persisted={persistedIds?.has(row.original.id)}
              onView={onViewDetails}
            />
            <SaveAdButton ad={normalizeLinkedInAd(row.original)} />
          </div>
        ),
      },
    ]
  }, [ads, selectedIds, onToggleSelect, onSelectAll, onViewDetails, persistedIds])

  return (
    <div className="overflow-x-auto rounded-xl border">
      <DataTable columns={columns} data={ads} enableColumnResizing />
    </div>
  )
}
