"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { NormalizedAd } from "../../search-ads/_components/normalized-ad"

// ponytail: localStorage persistence — no backend per task spec.
const STORAGE_KEY = "swipe-ads"

// Seed ads shown the first time a user opens Swipe Ads, so the page isn't empty
// before they've saved anything. Removed once the user un-saves them all.
const seedAds: NormalizedAd[] = [
  {
    id: "swipe-seed-1",
    platform: "Meta",
    advertiser: "Brightway Apparel",
    subtitle: "Active",
    headline: "Summer Sale 50% Off",
    description:
      "Video carousel ad promoting the summer collection with a limited-time discount code.",
    imageUrl: null,
    dateLabel: "2026-06-18",
    impressions: 184000,
  },
  {
    id: "swipe-seed-2",
    platform: "TikTok",
    advertiser: "Pureleaf Kombucha",
    subtitle: "Active",
    headline: "New Flavor Drop",
    description:
      "Creator-led short video announcing a new flavor with a hashtag challenge.",
    imageUrl: null,
    dateLabel: "2026-06-15",
    impressions: 96500,
  },
]

// Legacy entries were the flat AdResult shape; map them to NormalizedAd so
// previously-saved ads keep rendering after the store switched shapes.
interface LegacyAdResult {
  id: string
  title?: string
  advertiser?: string
  platform?: NormalizedAd["platform"]
  status?: string
  description?: string
  thumbnailUrl?: string | null
  date?: string
  impressions?: number
  spend?: number
}

function migrate(item: NormalizedAd | LegacyAdResult): NormalizedAd {
  // Already NormalizedAd if it has headline/imageUrl keys or lacks the legacy `title`.
  if (!("title" in item) || (item as LegacyAdResult).title === undefined) {
    return item as NormalizedAd
  }
  const legacy = item as LegacyAdResult
  return {
    id: legacy.id,
    platform: legacy.platform ?? "Meta",
    advertiser: legacy.advertiser ?? "Advertiser",
    subtitle: legacy.status ?? null,
    headline: legacy.title ?? null,
    description: legacy.description ?? null,
    imageUrl: legacy.thumbnailUrl ?? null,
    dateLabel: legacy.date ?? null,
    impressions: legacy.impressions,
    spend: legacy.spend,
  }
}

function readSaved(): NormalizedAd[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAds))
      return seedAds
    }
    const parsed = JSON.parse(raw) as (NormalizedAd | LegacyAdResult)[]
    return parsed.map(migrate)
  } catch {
    return []
  }
}

function persist(ads: NormalizedAd[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ads))
  } catch {
    // ignore write failures (quota, private mode)
  }
}

export function useSavedAds() {
  const [ads, setAds] = useState<NormalizedAd[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setAds(readSaved())
    setLoaded(true)
  }, [])

  // Reads fresh from storage on every write so multiple mounted instances
  // (e.g. one per result card) don't clobber each other's saves.
  const removeAd = useCallback((id: string) => {
    const next = readSaved().filter((ad) => ad.id !== id)
    persist(next)
    setAds(next)
  }, [])

  const saveAd = useCallback((ad: NormalizedAd) => {
    const current = readSaved()
    if (current.some((a) => a.id === ad.id)) return
    const next = [ad, ...current]
    persist(next)
    setAds(next)
  }, [])

  const toggleAd = useCallback((ad: NormalizedAd) => {
    const current = readSaved()
    const next = current.some((a) => a.id === ad.id)
      ? current.filter((a) => a.id !== ad.id)
      : [ad, ...current]
    persist(next)
    setAds(next)
  }, [])

  const savedIds = useMemo(() => new Set(ads.map((ad) => ad.id)), [ads])

  return { ads, loaded, savedIds, removeAd, saveAd, toggleAd }
}
