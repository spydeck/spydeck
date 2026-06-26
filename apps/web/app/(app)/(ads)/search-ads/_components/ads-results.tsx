"use client"

import { useEffect, useState } from "react"
import { BookmarkIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSavedAds } from "../../swipe-ads/_components/use-saved-ads"
import { AdCard } from "./ad-card"
import { AdsTable } from "./ads-table"
import { toAdResult, type NormalizedAd } from "./normalized-ad"

export function AdsResults({
  ads,
  total,
  resetKey,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  ads: NormalizedAd[]
  /** Total available results across all pages (when the API reports it). */
  total?: number
  /** When this value changes, the current selection is cleared (e.g. a new search). */
  resetKey?: unknown
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { saveAd } = useSavedAds()

  const resultsLabel =
    total != null
      ? `Displaying ${ads.length.toLocaleString()} results from ${total.toLocaleString()} results`
      : ads.length > 0
        ? `Displaying ${ads.length.toLocaleString()} results`
        : null

  useEffect(() => {
    setSelectedIds(new Set())
  }, [resetKey])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll(ids: string[], checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  function handleAddSelectedToSwipe() {
    const selected = ads.filter((ad) => selectedIds.has(ad.id))
    if (selected.length === 0) return
    for (const ad of selected) saveAd(toAdResult(ad))
    toast.success(
      `Added ${selected.length} ad${selected.length > 1 ? "s" : ""} to Swipe Ads`
    )
    setSelectedIds(new Set())
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="mt-4">
          <AdsTable
            ads={ads}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onSelectAll={toggleSelectAll}
          />
        </TabsContent>
        <TabsContent value="cards" className="mt-4">
          <div className="gap-4 columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {(resultsLabel || (hasNextPage && onLoadMore)) && (
        <div className="flex items-center justify-center gap-4 pt-2">
          {resultsLabel && (
            <p className="text-sm text-muted-foreground">{resultsLabel}</p>
          )}
          {hasNextPage && onLoadMore && (
            <Button
              variant="outline"
              onClick={onLoadMore}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading…" : "Load more ads"}
            </Button>
          )}
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-full border bg-background/95 py-2 pl-4 pr-2 shadow-lg backdrop-blur">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear selection"
              className="size-8"
              onClick={() => setSelectedIds(new Set())}
            >
              <XIcon />
            </Button>
            <Button size="sm" onClick={handleAddSelectedToSwipe}>
              <BookmarkIcon data-icon="inline-start" />
              Add to Swipe Ads
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
