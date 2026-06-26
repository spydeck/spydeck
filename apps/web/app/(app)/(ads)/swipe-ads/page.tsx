"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  DownloadIcon,
  FileTextIcon,
  MegaphoneIcon,
  SaveIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateRangeSelect, EMPTY_DATE_RANGE } from "@/components/date-range-select"
import { AdCard } from "../search-ads/_components/ad-card"
import { AdDetailSidebar } from "../search-ads/_components/ad-detail-sidebar"
import type { NormalizedAd } from "../search-ads/_components/normalized-ad"
import { AdvertiserFilter, advertiserOptions } from "./_components/advertiser-filter"
import { CategoryFilter } from "./_components/category-filter"
import { ChangeCategoryButton } from "./_components/change-category-button"
import { SwipeAdsTable } from "./_components/swipe-ads-table"
import { useSavedAds } from "./_components/use-saved-ads"
import { useSwipeCategories } from "./_components/use-categories"

export default function SwipeAdsPage() {
  const { ads, rows, loaded, removeAd } = useSavedAds()
  const { categories } = useSwipeCategories()
  const [advertiser, setAdvertiser] = useState("all")
  const [category, setCategory] = useState("all")
  const [dateRange, setDateRange] = useState(EMPTY_DATE_RANGE)
  const [detailAd, setDetailAd] = useState<NormalizedAd | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const options = useMemo(() => advertiserOptions(ads), [ads])
  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        if (advertiser !== "all" && r.ad.advertiser !== advertiser) return false
        if (category === "none" && r.categoryId) return false
        if (category !== "all" && category !== "none" && r.categoryId !== category)
          return false
        const day = r.createdAt.slice(0, 10)
        if (dateRange.from && day < dateRange.from) return false
        if (dateRange.to && day > dateRange.to) return false
        return true
      }),
    [rows, advertiser, category, dateRange]
  )
  const filtered = useMemo(() => filteredRows.map((r) => r.ad), [filteredRows])
  const selectedAds = filteredRows
    .filter((r) => selectedIds.has(r.ad.id))
    .map((r) => r.ad)

  function handleViewDetails(id: string) {
    const ad = filtered.find((a) => a.id === id)
    if (ad) setDetailAd(ad)
  }

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

  function handleRemoveSelected() {
    for (const id of selectedIds) removeAd(id)
    setSelectedIds(new Set())
  }

  // ponytail: backend wiring pending — stubs surface the action without it.
  function handleDownloadAds() {
    toast.info(`Download ${selectedAds.length} ad(s) — not implemented yet`)
  }

  function handleDownloadText() {
    toast.info(
      `Download text copy of ${selectedAds.length} ad(s) — not implemented yet`
    )
  }

  return (
    <>
      <SiteHeader title="Swipe Ads" />
      <div className="flex flex-1 flex-col gap-6 px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Swipe Ads</h1>
            <p className="text-sm text-muted-foreground">
              Ads you have saved from Search Ads for inspiration and reference.
            </p>
          </div>
          {ads.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <AdvertiserFilter
                value={advertiser}
                onChange={setAdvertiser}
                options={options}
                className="w-full sm:w-48"
              />
              <CategoryFilter
                value={category}
                onChange={setCategory}
                categories={categories}
                className="w-full sm:w-48"
              />
              <DateRangeSelect
                value={dateRange}
                onChange={setDateRange}
                className="w-full sm:w-60"
              />
            </div>
          )}
        </div>

        {!loaded ? null : ads.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <SaveIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No saved ads yet.{" "}
              <Link href="/search-ads" className="underline underline-offset-2">
                Search and save ads from the Search Ads page.
              </Link>
            </p>
          </div>
        ) : (
          <Tabs defaultValue="cards">
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
            </TabsList>
            <TabsContent value="table" className="mt-4">
              <SwipeAdsTable
                rows={filteredRows}
                categories={categories}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onSelectAll={toggleSelectAll}
                onViewDetails={handleViewDetails}
                onRemove={removeAd}
              />
            </TabsContent>
            <TabsContent value="cards" className="mt-4">
              <div className="gap-4 columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
                {filtered.map((ad) => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {loaded && ads.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "saved ad" : "saved ads"}
          </p>
        )}

        {ads.length === 0 ? null : (
          <p className="text-xs text-muted-foreground">
            <MegaphoneIcon className="size-3.5 inline-block align-text-bottom mr-1" />
            Find more in{" "}
            <Link href="/search-ads" className="underline underline-offset-2">
              Search Ads
            </Link>
            .
          </p>
        )}
      </div>

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
            <ChangeCategoryButton
              adIds={[...selectedIds]}
              onDone={() => setSelectedIds(new Set())}
            />
            <Button size="sm" variant="secondary" onClick={handleDownloadAds}>
              <DownloadIcon data-icon="inline-start" />
              Download Ads
            </Button>
            <Button size="sm" variant="secondary" onClick={handleDownloadText}>
              <FileTextIcon data-icon="inline-start" />
              Download Text copy
            </Button>
            <Button size="sm" variant="destructive" onClick={handleRemoveSelected}>
              <Trash2Icon data-icon="inline-start" />
              Remove
            </Button>
          </div>
        </div>
      )}

      <AdDetailSidebar ad={detailAd} onClose={() => setDetailAd(null)} />
    </>
  )
}
