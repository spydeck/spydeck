"use client"

import { useMemo } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { format, parseISO } from "date-fns"
import { Trash2Icon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { AdThumbnail } from "../../search-ads/_components/ad-thumbnail"
import { ViewDetailsButton } from "../../search-ads/_components/view-details-button"
import type { SwipeAdRow } from "./use-saved-ads"
import type { SwipeCategory } from "./use-categories"

export function SwipeAdsTable({
  rows,
  categories,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onViewDetails,
  onRemove,
}: {
  rows: SwipeAdRow[]
  categories: SwipeCategory[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[], checked: boolean) => void
  onViewDetails: (id: string) => void
  onRemove: (id: string) => void
}) {
  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  )

  const columns = useMemo<ColumnDef<SwipeAdRow>[]>(() => {
    const allSelected =
      rows.length > 0 && rows.every((r) => selectedIds.has(r.ad.id))
    const someSelected = rows.some((r) => selectedIds.has(r.ad.id))
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
            onCheckedChange={(c) =>
              onSelectAll(rows.map((r) => r.ad.id), c === true)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.ad.id)}
            aria-label="Select ad"
            onCheckedChange={() => onToggleSelect(row.original.ad.id)}
          />
        ),
      },
      {
        id: "advertiser",
        accessorFn: (r) => r.ad.advertiser,
        size: 200,
        minSize: 140,
        header: "Advertiser",
        cell: ({ row }) => {
          const ad = row.original.ad
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
        accessorFn: (r) => r.ad.headline ?? r.ad.description ?? "",
        size: 360,
        minSize: 180,
        header: "Ad",
        cell: ({ row }) => {
          const ad = row.original.ad
          return (
            <div className="w-[340px] max-w-full">
              {ad.headline && (
                <p className="truncate font-medium text-foreground">{ad.headline}</p>
              )}
              {ad.description && (
                <p className="truncate text-xs text-muted-foreground">
                  {ad.description}
                </p>
              )}
              {!ad.headline && !ad.description && (
                <span className="text-muted-foreground">–</span>
              )}
            </div>
          )
        },
      },
      {
        id: "createdAt",
        accessorFn: (r) => r.createdAt,
        size: 140,
        minSize: 120,
        header: "Date added",
        cell: ({ row }) => {
          const d = parseISO(row.original.createdAt)
          return (
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              {isNaN(d.getTime()) ? "–" : format(d, "dd/MM/yyyy")}
            </span>
          )
        },
      },
      {
        id: "category",
        accessorFn: (r) =>
          (r.categoryId && categoryById.get(r.categoryId)?.name) || "",
        size: 150,
        minSize: 120,
        header: "Category",
        cell: ({ row }) => {
          const cat = row.original.categoryId
            ? categoryById.get(row.original.categoryId)
            : undefined
          if (!cat) return <span className="text-muted-foreground">–</span>
          return (
            <Badge variant="secondary" className="gap-1.5 font-normal">
              <span
                className="size-2 shrink-0 rounded-full border"
                style={cat.color ? { backgroundColor: cat.color } : undefined}
              />
              {cat.name}
            </Badge>
          )
        },
      },
      {
        id: "thumbnail",
        enableSorting: false,
        enableResizing: false,
        size: 72,
        header: "",
        cell: ({ row }) => <AdThumbnail ad={row.original.ad} />,
      },
      {
        id: "actions",
        enableSorting: false,
        enableResizing: false,
        size: 96,
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <ViewDetailsButton
              externalId={row.original.ad.id}
              persisted
              onView={onViewDetails}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove from Swipe Ads"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(row.original.ad.id)}
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ),
      },
    ]
  }, [
    rows,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    onViewDetails,
    onRemove,
    categoryById,
  ])

  return (
    <div className="overflow-x-auto rounded-xl border">
      <DataTable columns={columns} data={rows} enableColumnResizing />
    </div>
  )
}
