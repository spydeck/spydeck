import type { AdPlatform, AdResult } from "./mock-ads"

export interface AdStat {
  label: string
  value: string
}

// Platform-agnostic view model. Every platform panel maps its raw API response
// into this shape so the shared card/table/results components stay generic.
export interface NormalizedAd {
  id: string
  platform: AdPlatform
  advertiser: string
  subtitle?: string | null
  headline?: string | null
  description?: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  destinationUrl?: string | null
  cta?: string | null
  dateLabel?: string | null
  stats?: AdStat[]
  // Numeric values stored on the saved Swipe Ad record (optional per platform).
  impressions?: number
  spend?: number
}

export function toAdResult(ad: NormalizedAd): AdResult {
  return {
    id: ad.id,
    title: ad.headline || ad.advertiser,
    advertiser: ad.advertiser,
    platform: ad.platform,
    // ponytail: most ad-library APIs expose no delivery status; default sensibly.
    status: "Active",
    description: ad.description ?? "",
    thumbnailUrl: ad.imageUrl ?? null,
    date: ad.dateLabel ?? "",
    impressions: ad.impressions ?? 0,
    spend: ad.spend ?? 0,
  }
}
