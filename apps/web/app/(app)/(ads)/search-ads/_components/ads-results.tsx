"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { BookmarkIcon, FileSearchIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSavedAds } from "../../swipe-ads/_components/use-saved-ads"
import { AdDetailSidebar } from "./ad-detail-sidebar"
import { GoogleAdsTable } from "../google/_components/google-ads-table"
import type { GoogleAd } from "../google/_components/google-ad"
import { LinkedInAdsTable } from "../linkedin/_components/linkedin-ads-table"
import type { LinkedInAd } from "../linkedin/_components/linkedin-ad"
import { MetaAdsTable } from "../meta/_components/meta-ads-table"
import type { MetaAdResult } from "../meta/_components/meta-ad"
import { TikTokAdsTable } from "../tiktok/_components/tiktok-ads-table"
import type { TikTokAd } from "../tiktok/_components/tiktok-ad"
import { AdCard } from "./ad-card"
import {
  toAdDetailRequest,
  toAdResult,
  type AdDetailRequest,
  type NormalizedAd,
} from "./normalized-ad"

type PlatformTableProps = {
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onSelectAll: (ids: string[], checked: boolean) => void
  onViewDetails: (externalId: string) => void
  persistedIds: Set<string>
}

type AdsResultsProps<TRaw> = {
  ads: NormalizedAd[]
  rawAds: TRaw[]
  platform: NormalizedAd["platform"]
  /** Total available results across all pages (when the API reports it). */
  total?: number
  /** When this value changes, the current selection is cleared (e.g. a new search). */
  resetKey?: unknown
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onLoadMore?: () => void
}

export function AdsResults<TRaw>({
  ads,
  rawAds,
  platform,
  total,
  resetKey,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: AdsResultsProps<TRaw>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [fetchingDetails, setFetchingDetails] = useState(false)
  const [detailAd, setDetailAd] = useState<NormalizedAd | null>(null)
  const { saveAd } = useSavedAds()
  const queryClient = useQueryClient()

  // Which of the shown ads already have a persisted detail (so rows are marked).
  const apiPlatform = platform.toLowerCase()
  const externalIds = useMemo(() => ads.map((ad) => ad.id), [ads])
  const { data: persisted } = useQuery({
    queryKey: ["ad-persisted", apiPlatform, externalIds],
    queryFn: () =>
      apiFetch<string[]>("/sync/ad-details/lookup", {
        method: "POST",
        body: JSON.stringify({ platform: apiPlatform, externalIds }),
      }),
    enabled: externalIds.length > 0,
  })
  const persistedIds = useMemo(() => new Set(persisted ?? []), [persisted])

  function handleViewDetails(externalId: string) {
    const ad = ads.find((a) => a.id === externalId)
    if (ad) setDetailAd(ad)
  }

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

  async function handleFetchDetails() {
    const requests = ads
      .filter((ad) => selectedIds.has(ad.id))
      .map(toAdDetailRequest)
      .filter((r): r is AdDetailRequest => r !== null)
    if (requests.length === 0) {
      toast.error("Selected ads don't support detail fetching")
      return
    }
    setFetchingDetails(true)
    try {
      await apiFetch("/sync/ad-details", {
        method: "POST",
        body: JSON.stringify({ ads: requests }),
      })
      toast.success(
        `Queued detail fetch for ${requests.length} ad${requests.length > 1 ? "s" : ""}`
      )
      setSelectedIds(new Set())
      // ponytail: jobs are async with no completion signal here; refresh the
      // persisted set after a short delay so synced rows turn green. Poll the
      // job status if exact timing matters.
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["ad-persisted", apiPlatform] })
      }, 5000)
    } catch {
      toast.error("Failed to queue ad detail fetch")
    } finally {
      setFetchingDetails(false)
    }
  }

  const tableProps: PlatformTableProps = {
    selectedIds,
    onToggleSelect: toggleSelect,
    onSelectAll: toggleSelectAll,
    onViewDetails: handleViewDetails,
    persistedIds,
  }

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="mt-4">
          {platform === "Google" && (
            <GoogleAdsTable ads={rawAds as GoogleAd[]} {...tableProps} />
          )}
          {platform === "Meta" && (
            <MetaAdsTable ads={rawAds as MetaAdResult[]} {...tableProps} />
          )}
          {platform === "TikTok" && (
            <TikTokAdsTable ads={rawAds as TikTokAd[]} {...tableProps} />
          )}
          {platform === "LinkedIn" && (
            <LinkedInAdsTable ads={rawAds as LinkedInAd[]} {...tableProps} />
          )}
        </TabsContent>
        <TabsContent value="cards" className="mt-4">
          <div className="gap-4 columns-1 sm:columns-2 md:columns-3 lg:columns-4 2xl:columns-5">
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
            <Button
              size="sm"
              variant="secondary"
              disabled={fetchingDetails}
              onClick={handleFetchDetails}
            >
              <FileSearchIcon data-icon="inline-start" />
              {fetchingDetails ? "Fetching…" : "Fetch details"}
            </Button>
          </div>
        </div>
      )}

      <AdDetailSidebar ad={detailAd} onClose={() => setDetailAd(null)} />
    </div>
  )
}
