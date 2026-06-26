"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { AdThumbnail } from "../../_components/ad-thumbnail"
import { SaveAdButton } from "../../_components/save-ad-button"
import { formatCompact, normalizeTikTokAd, type TikTokAd } from "./tiktok-ad"

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "–"
  const total = Math.round(seconds)
  if (total < 60) return `${total}s`
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}m ${s.toString().padStart(2, "0")}s`
}

export function TikTokAdsTable({
  ads,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: {
  ads: TikTokAd[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[], checked: boolean) => void
}) {
  const columns = useMemo<ColumnDef<TikTokAd>[]>(() => {
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
        id: "brand",
        accessorFn: (ad) => ad.brand_name ?? "",
        size: 200,
        minSize: 140,
        header: "Brand",
        cell: ({ row }) => {
          const name = row.original.brand_name || "Advertiser"
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
        id: "title",
        accessorFn: (ad) => ad.ad_title ?? "",
        size: 320,
        minSize: 160,
        header: "Title",
        cell: ({ row }) => (
          <p className="line-clamp-1 max-w-md font-medium text-foreground">
            {row.original.ad_title || "–"}
          </p>
        ),
      },
      {
        id: "industry",
        accessorFn: (ad) => ad.industry_key ?? "",
        size: 160,
        minSize: 120,
        header: "Industry",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.industry_key || "–"}</span>
        ),
      },
      {
        id: "likes",
        accessorFn: (ad) => ad.like ?? 0,
        size: 100,
        minSize: 80,
        header: "Likes",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatCompact(row.original.like ?? 0)}
          </span>
        ),
      },
      {
        id: "ctr",
        accessorFn: (ad) => ad.ctr ?? 0,
        size: 100,
        minSize: 80,
        header: "CTR",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {`${((row.original.ctr ?? 0) * 100).toFixed(1)}%`}
          </span>
        ),
      },
      {
        id: "cost",
        accessorFn: (ad) => ad.cost ?? 0,
        size: 100,
        minSize: 80,
        header: "Cost",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {`$${formatCompact(row.original.cost ?? 0)}`}
          </span>
        ),
      },
      {
        id: "duration",
        accessorFn: (ad) => ad.video_info?.duration ?? 0,
        size: 110,
        minSize: 90,
        header: "Duration",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDuration(row.original.video_info?.duration ?? 0)}
          </span>
        ),
      },
      {
        id: "thumbnail",
        enableSorting: false,
        size: 96,
        minSize: 72,
        header: "Thumbnail",
        cell: ({ row }) => <AdThumbnail ad={normalizeTikTokAd(row.original)} />,
      },
      {
        id: "actions",
        enableSorting: false,
        enableResizing: false,
        size: 56,
        header: () => null,
        cell: ({ row }) => <SaveAdButton ad={normalizeTikTokAd(row.original)} />,
      },
    ]
  }, [ads, selectedIds, onToggleSelect, onSelectAll])

  return (
    <div className="overflow-x-auto rounded-xl border">
      <DataTable columns={columns} data={ads} enableColumnResizing />
    </div>
  )
}
