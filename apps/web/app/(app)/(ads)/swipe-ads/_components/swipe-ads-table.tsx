"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTable } from "@/components/ui/data-table"
import { AdThumbnail } from "../../search-ads/_components/ad-thumbnail"
import { SaveAdButton } from "../../search-ads/_components/save-ad-button"
import { ViewDetailsButton } from "../../search-ads/_components/view-details-button"
import type { NormalizedAd } from "../../search-ads/_components/normalized-ad"

export function SwipeAdsTable({
  ads,
  onViewDetails,
}: {
  ads: NormalizedAd[]
  onViewDetails: (id: string) => void
}) {
  const columns = useMemo<ColumnDef<NormalizedAd>[]>(
    () => [
      {
        id: "thumbnail",
        enableSorting: false,
        size: 80,
        header: "Thumbnail",
        cell: ({ row }) => <AdThumbnail ad={row.original} />,
      },
      {
        id: "advertiser",
        accessorFn: (ad) => ad.advertiser,
        size: 220,
        minSize: 140,
        header: "Advertiser",
        cell: ({ row }) => {
          const ad = row.original
          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-8 rounded-md">
                {ad.advertiserLogo && (
                  <AvatarImage src={ad.advertiserLogo} alt={ad.advertiser} />
                )}
                <AvatarFallback className="rounded-md bg-muted text-xs font-semibold">
                  {ad.advertiser.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{ad.advertiser}</span>
                <span className="text-xs text-muted-foreground">{ad.platform}</span>
              </div>
            </div>
          )
        },
      },
      {
        id: "ad",
        accessorFn: (ad) => ad.headline ?? ad.description ?? "",
        size: 340,
        minSize: 160,
        header: "Ad",
        cell: ({ row }) => {
          const ad = row.original
          return (
            <div className="max-w-md min-w-0">
              {ad.headline && (
                <p className="font-medium text-foreground line-clamp-1">{ad.headline}</p>
              )}
              {ad.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {ad.description}
                </p>
              )}
            </div>
          )
        },
      },
      {
        id: "date",
        accessorFn: (ad) => ad.dateLabel ?? "",
        size: 150,
        minSize: 110,
        header: "Date",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.dateLabel ?? "–"}
          </span>
        ),
      },
      {
        id: "stats",
        enableSorting: false,
        size: 160,
        minSize: 120,
        header: "Stats",
        cell: ({ row }) => {
          const stats = row.original.stats
          if (!stats || stats.length === 0) return "–"
          return (
            <div className="whitespace-nowrap text-xs text-muted-foreground">
              {stats.map((s) => (
                <div key={s.label}>
                  {s.label}:{" "}
                  <span className="font-medium text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          )
        },
      },
      {
        id: "actions",
        enableSorting: false,
        enableResizing: false,
        size: 96,
        header: () => null,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <ViewDetailsButton
              externalId={row.original.id}
              persisted
              onView={onViewDetails}
            />
            <SaveAdButton ad={row.original} />
          </div>
        ),
      },
    ],
    [onViewDetails]
  )

  return (
    <div className="overflow-x-auto rounded-xl border">
      <DataTable columns={columns} data={ads} enableColumnResizing />
    </div>
  )
}
