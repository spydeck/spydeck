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

// Request shape for the backend ad-detail extractor (POST /sync/ad-details).
export interface AdDetailRequest {
  platform: 'linkedin' | 'meta' | 'tiktok' | 'google'
  externalId: string
  url?: string
  adId?: string
}

// Maps an ad to its detail-fetch request. LinkedIn/Google fetch by URL, Meta/TikTok
// by id. Returns null for ads with no usable detail endpoint (e.g. YouTube, or a
// Google ad missing its transparency URL).
export function toAdDetailRequest(ad: NormalizedAd): AdDetailRequest | null {
  switch (ad.platform) {
    case "LinkedIn":
      return {
        platform: "linkedin",
        externalId: ad.id,
        url: `https://www.linkedin.com/ad-library/detail/${ad.id}`,
      }
    case "Google":
      return ad.destinationUrl
        ? { platform: "google", externalId: ad.id, url: ad.destinationUrl }
        : null
    case "Meta":
      return { platform: "meta", externalId: ad.id, adId: ad.id }
    case "TikTok":
      return { platform: "tiktok", externalId: ad.id, adId: ad.id }
    default:
      return null
  }
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
