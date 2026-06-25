"use client"

import { useCallback, useEffect, useState } from "react"
import type { AdResult } from "../../search-ads/_components/mock-ads"

// ponytail: localStorage persistence — no backend per task spec.
const STORAGE_KEY = "swipe-ads"

// Seed ads shown the first time a user opens Swipe Ads, so the page isn't empty
// before they've saved anything. Removed once the user un-saves them all.
const seedAds: AdResult[] = [
  {
    id: "swipe-seed-1",
    title: "Summer Sale 50% Off",
    advertiser: "Brightway Apparel",
    platform: "Meta",
    status: "Active",
    description:
      "Video carousel ad promoting the summer collection with a limited-time discount code.",
    thumbnailUrl: null,
    date: "2026-06-18",
    impressions: 184000,
    spend: 4200,
  },
  {
    id: "swipe-seed-2",
    title: "New Flavor Drop",
    advertiser: "Pureleaf Kombucha",
    platform: "TikTok",
    status: "Active",
    description:
      "Creator-led short video announcing a new flavor with a hashtag challenge.",
    thumbnailUrl: null,
    date: "2026-06-15",
    impressions: 96500,
    spend: 1800,
  },
]

function readSaved(): AdResult[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAds))
      return seedAds
    }
    return JSON.parse(raw) as AdResult[]
  } catch {
    return []
  }
}

export function useSavedAds() {
  const [ads, setAds] = useState<AdResult[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setAds(readSaved())
    setLoaded(true)
  }, [])

  const removeAd = useCallback((id: string) => {
    setAds((prev) => {
      const next = prev.filter((ad) => ad.id !== id)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore write failures (quota, private mode)
      }
      return next
    })
  }, [])

  return { ads, loaded, removeAd }
}