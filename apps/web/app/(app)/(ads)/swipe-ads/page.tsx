"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { MegaphoneIcon, SaveIcon } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdCard } from "../search-ads/_components/ad-card"
import { AdDetailSidebar } from "../search-ads/_components/ad-detail-sidebar"
import type { NormalizedAd } from "../search-ads/_components/normalized-ad"
import { AdvertiserFilter, advertiserOptions } from "./_components/advertiser-filter"
import { SwipeAdsTable } from "./_components/swipe-ads-table"
import { useSavedAds } from "./_components/use-saved-ads"

export default function SwipeAdsPage() {
  const { ads, loaded } = useSavedAds()
  const [advertiser, setAdvertiser] = useState("all")
  const [detailAd, setDetailAd] = useState<NormalizedAd | null>(null)

  const options = useMemo(() => advertiserOptions(ads), [ads])
  const filtered = useMemo(
    () =>
      advertiser === "all"
        ? ads
        : ads.filter((ad) => ad.advertiser === advertiser),
    [ads, advertiser]
  )

  function handleViewDetails(id: string) {
    const ad = filtered.find((a) => a.id === id)
    if (ad) setDetailAd(ad)
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
            <AdvertiserFilter
              value={advertiser}
              onChange={setAdvertiser}
              options={options}
              className="w-full sm:w-56"
            />
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {loaded ? filtered.length : 0}{" "}
          {filtered.length === 1 ? "saved ad" : "saved ads"}
        </p>

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
              <SwipeAdsTable ads={filtered} onViewDetails={handleViewDetails} />
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

      <AdDetailSidebar ad={detailAd} onClose={() => setDetailAd(null)} />
    </>
  )
}
