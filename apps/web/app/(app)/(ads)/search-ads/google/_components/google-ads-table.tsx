"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { AdThumbnail } from "../../_components/ad-thumbnail"
import { SaveAdButton } from "../../_components/save-ad-button"
import { ViewDetailsButton } from "../../_components/view-details-button"
import { dateSortValue, formatDateLabel } from "../../_components/date-utils"
import { normalizeGoogleAd, type GoogleAd } from "./google-ad"

export function GoogleAdsTable({
  ads,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onViewDetails,
  persistedIds,
}: {
  ads: GoogleAd[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[], checked: boolean) => void
  onViewDetails?: (externalId: string) => void
  persistedIds?: Set<string>
}) {
  const columns = useMemo<ColumnDef<GoogleAd>[]>(() => {
    const allSelected =
      ads.length > 0 && ads.every((a) => selectedIds.has(a.creativeId))
    const someSelected = ads.some((a) => selectedIds.has(a.creativeId))
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
              onSelectAll(ads.map((a) => a.creativeId), checked === true)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.creativeId)}
            aria-label="Select ad"
            onCheckedChange={() => onToggleSelect(row.original.creativeId)}
          />
        ),
      },
      {
        id: "advertiser",
        accessorFn: (ad) => ad.advertiserName ?? "",
        size: 220,
        minSize: 140,
        header: "Advertiser",
        cell: ({ row }) => {
          const name = row.original.advertiserName || "Advertiser"
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
        id: "format",
        accessorFn: (ad) => ad.format ?? "",
        size: 120,
        minSize: 80,
        header: "Format",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.format || "–"}</span>
        ),
      },
      {
        id: "firstShown",
        accessorFn: (ad) => dateSortValue(ad.firstShown),
        size: 140,
        minSize: 110,
        header: "First shown",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDateLabel(row.original.firstShown)}
          </span>
        ),
      },
      {
        id: "lastShown",
        accessorFn: (ad) => dateSortValue(ad.lastShown),
        size: 140,
        minSize: 110,
        header: "Last shown",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDateLabel(row.original.lastShown)}
          </span>
        ),
      },
      {
        id: "link",
        enableSorting: false,
        size: 100,
        minSize: 80,
        header: "Link",
        cell: ({ row }) =>
          row.original.adUrl ? (
            <a
              href={row.original.adUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-primary hover:underline"
            >
              View ad
            </a>
          ) : (
            <span className="text-muted-foreground">–</span>
          ),
      },
      {
        id: "thumbnail",
        enableSorting: false,
        size: 96,
        minSize: 72,
        header: "Thumbnail",
        cell: ({ row }) => <AdThumbnail ad={normalizeGoogleAd(row.original)} />,
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
              externalId={row.original.creativeId}
              persisted={persistedIds?.has(row.original.creativeId)}
              onView={onViewDetails}
            />
            <SaveAdButton ad={normalizeGoogleAd(row.original)} />
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
