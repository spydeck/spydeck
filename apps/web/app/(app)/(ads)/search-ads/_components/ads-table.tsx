"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { format, isValid, parse, parseISO } from "date-fns"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { AdThumbnail } from "./ad-thumbnail"
import { SaveAdButton } from "./save-ad-button"
import type { NormalizedAd } from "./normalized-ad"

// Matches ISO dates/timestamps (2025-08-10, 2025-08-10T07:00:00.000Z) or
// "Aug 10, 2025" substrings inside a label.
const DATE_TOKEN =
  /\d{4}-\d{2}-\d{2}(?:T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?|[A-Z][a-z]{2,8} \d{1,2}, \d{4}/g

function toDdMmYyyy(token: string): string {
  let d = parseISO(token)
  if (!isValid(d)) d = parse(token, "MMM d, yyyy", new Date())
  return isValid(d) ? format(d, "dd/MM/yyyy") : token
}

function formatDateLabel(label?: string | null): string {
  if (!label) return "–"
  return label.replace(DATE_TOKEN, toDdMmYyyy)
}

// Timestamp of the first date in the label, for chronological column sorting.
function dateSortValue(label?: string | null): number {
  const token = label?.match(DATE_TOKEN)?.[0]
  if (!token) return 0
  let d = parseISO(token)
  if (!isValid(d)) d = parse(token, "MMM d, yyyy", new Date())
  return isValid(d) ? d.getTime() : 0
}

export function AdsTable({
  ads,
  selectedIds,
  onToggleSelect,
  onSelectAll,
}: {
  ads: NormalizedAd[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[], checked: boolean) => void
}) {
  const columns = useMemo<ColumnDef<NormalizedAd>[]>(() => {
    const allSelected = ads.length > 0 && ads.every((a) => selectedIds.has(a.id))
    const someSelected = ads.some((a) => selectedIds.has(a.id))
    return [
      {
        id: "select",
        enableSorting: false,
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
        accessorFn: (ad) => ad.advertiser,
        header: "Advertiser",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar className="size-8 rounded-md">
              <AvatarFallback className="rounded-md bg-muted text-xs font-semibold">
                {row.original.advertiser.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{row.original.advertiser}</span>
          </div>
        ),
      },
      {
        id: "ad",
        accessorFn: (ad) => ad.headline ?? ad.description ?? "",
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
              {ad.destinationUrl && (
                <a
                  href={ad.destinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {ad.cta || "View details"}
                </a>
              )}
            </div>
          )
        },
      },
      {
        id: "date",
        accessorFn: (ad) => dateSortValue(ad.dateLabel),
        header: "Date",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatDateLabel(row.original.dateLabel)}
          </span>
        ),
      },
      {
        id: "stats",
        header: "Stats",
        cell: ({ row }) => {
          const stats = row.original.stats
          if (!stats || stats.length === 0) return "–"
          return (
            <div className="whitespace-nowrap text-xs text-muted-foreground">
              {stats.map((stat) => (
                <div key={stat.label}>
                  {stat.label}:{" "}
                  <span className="font-medium text-foreground">{stat.value}</span>
                </div>
              ))}
            </div>
          )
        },
      },
      {
        id: "thumbnail",
        header: "Thumbnail",
        cell: ({ row }) => <AdThumbnail ad={row.original} />,
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => <SaveAdButton ad={row.original} />,
      },
    ]
  }, [ads, selectedIds, onToggleSelect, onSelectAll])

  return (
    <div className="overflow-hidden rounded-xl border">
      <DataTable columns={columns} data={ads} />
    </div>
  )
}
