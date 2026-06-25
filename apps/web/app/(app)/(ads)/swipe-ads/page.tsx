"use client"

import Link from "next/link"
import { MegaphoneIcon, SaveIcon, Trash2Icon } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { AdResult, AdStatus } from "../search-ads/_components/mock-ads"
import { useSavedAds } from "./_components/use-saved-ads"

const statusVariant: Record<AdStatus, "secondary" | "outline"> = {
  Active: "secondary",
  Paused: "outline",
  Ended: "outline",
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

export default function SwipeAdsPage() {
  const { ads, loaded, removeAd } = useSavedAds()

  return (
    <>
      <SiteHeader title="Swipe Ads" />
      <div className="flex flex-1 flex-col gap-6 px-4 py-10">
        <div>
          <h1 className="text-xl font-semibold">Swipe Ads</h1>
          <p className="text-sm text-muted-foreground">
            Ads you have saved from Search Ads for inspiration and reference.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          {loaded ? ads.length : 0} {ads.length === 1 ? "saved ad" : "saved ads"}
        </p>

        {!loaded ? null : ads.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <SaveIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No saved ads yet.{" "}
              <Link
                href="/search-ads"
                className="underline underline-offset-2"
              >
                Search and save ads from the Search Ads page.
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ads.map((ad: AdResult) => (
              <Card key={ad.id} className="rounded-xl">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{ad.title}</CardTitle>
                    <Badge variant={statusVariant[ad.status]}>{ad.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {ad.advertiser}
                    </span>
                    <span>·</span>
                    <span>{ad.platform}</span>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="line-clamp-3">{ad.description}</p>
                </CardContent>
                <CardFooter className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{ad.date}</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <span className="text-muted-foreground">Imp.</span>
                      <span className="font-medium">
                        {formatCompact(ad.impressions)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-muted-foreground">Spend</span>
                      <span className="font-medium">
                        ${formatCompact(ad.spend)}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAd(ad.id)}
                      aria-label={`Remove ${ad.title} from saved ads`}
                    >
                      <Trash2Icon data-icon="inline-start" />
                      Remove
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
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
    </>
  )
}