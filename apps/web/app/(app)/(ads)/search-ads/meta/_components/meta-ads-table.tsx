"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { AdThumbnail } from "../../_components/ad-thumbnail"
import { MetaPlatformIcons } from "../../_components/meta-platform-icons"
import { SaveAdButton } from "../../_components/save-ad-button"
import { ViewDetailsButton } from "../../_components/view-details-button"
import { dateSortValue, formatDateLabel } from "../../_components/date-utils"
import { normalizeMetaAd, type MetaAdResult } from "./meta-ad"

function spendSortValue(ad: MetaAdResult): number {
  const lower = ad.spend?.lower_bound
  return lower != null ? Number(lower) || 0 : 0
}

function spendLabel(ad: MetaAdResult): string {
  const lower = ad.spend?.lower_bound
  const upper = ad.spend?.upper_bound
  if (!lower && !upper) return "–"
  return `$${lower ?? "?"}–$${upper ?? "?"}`
}

function metaDateLabel(ad: MetaAdResult): string {
  if (!ad.start_date_string) return "–"
  return `${ad.start_date_string} – ${ad.end_date_string ?? "–"}`
}

export function MetaAdsTable({
  ads,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onViewDetails,
  persistedIds,
}: {
  ads: MetaAdResult[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[], checked: boolean) => void
  onViewDetails?: (externalId: string) => void
  persistedIds?: Set<string>
}) {
  const columns = useMemo<ColumnDef<MetaAdResult>[]>(() => {
    const allSelected =
      ads.length > 0 && ads.every((a) => selectedIds.has(a.ad_archive_id))
    const someSelected = ads.some((a) => selectedIds.has(a.ad_archive_id))
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
              onSelectAll(ads.map((a) => a.ad_archive_id), checked === true)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.ad_archive_id)}
            aria-label="Select ad"
            onCheckedChange={() => onToggleSelect(row.original.ad_archive_id)}
          />
        ),
      },
      {
        id: "advertiser",
        accessorFn: (ad) => ad.snapshot?.page_name || ad.page_name || "",
        size: 220,
        minSize: 140,
        header: "Advertiser",
        cell: ({ row }) => {
          const name =
            row.original.snapshot?.page_name ||
            row.original.page_name ||
            "Advertiser"
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
        accessorFn: (ad) => ad.snapshot?.title ?? "",
        size: 320,
        minSize: 160,
        header: "Headline",
        cell: ({ row }) => (
          <p className="line-clamp-1 max-w-md font-medium text-foreground">
            {row.original.snapshot?.title || "–"}
          </p>
        ),
      },
      {
        id: "status",
        accessorFn: (ad) => (ad.is_active ? 1 : 0),
        size: 100,
        minSize: 80,
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? "default" : "secondary"}>
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "platforms",
        enableSorting: false,
        size: 160,
        minSize: 120,
        header: "Platforms",
        cell: ({ row }) => {
          const value = row.original.publisher_platform?.join(",") ?? ""
          if (!value) return <span className="text-muted-foreground">–</span>
          return <MetaPlatformIcons value={value} />
        },
      },
      {
        id: "spend",
        accessorFn: (ad) => spendSortValue(ad),
        size: 140,
        minSize: 100,
        header: "Spend",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {spendLabel(row.original)}
          </span>
        ),
      },
      {
        id: "dates",
        accessorFn: (ad) => dateSortValue(metaDateLabel(ad)),
        size: 180,
        minSize: 140,
        header: "Dates",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDateLabel(metaDateLabel(row.original))}
          </span>
        ),
      },
      {
        id: "thumbnail",
        enableSorting: false,
        size: 96,
        minSize: 72,
        header: "Thumbnail",
        cell: ({ row }) => <AdThumbnail ad={normalizeMetaAd(row.original)} />,
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
              externalId={row.original.ad_archive_id}
              persisted={persistedIds?.has(row.original.ad_archive_id)}
              onView={onViewDetails}
            />
            <SaveAdButton ad={normalizeMetaAd(row.original)} />
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
