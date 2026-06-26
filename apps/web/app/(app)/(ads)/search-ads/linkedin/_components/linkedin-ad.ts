import type { NormalizedAd } from "../../_components/normalized-ad"

export interface LinkedInAd {
  id: string
  description?: string | null
  headline?: string | null
  poster?: string | null
  posterTitle?: string | null
  adType?: string
  advertiser?: string
  advertiserLinkedinPage?: string | null
  cta?: string | null
  destinationUrl?: string | null
  image?: string | null
  video?: string | null
  adDuration?: string | null
  startDate?: string | null
  endDate?: string | null
  totalImpressions?: number | string | null
}

export interface LinkedInAdsResponse {
  ads: LinkedInAd[]
  paginationToken?: string
  isLastPage?: boolean
  totalAds?: number
}

export function normalizeLinkedInAd(ad: LinkedInAd): NormalizedAd {
  const impressions = ad.totalImpressions
  const hasImpressions = impressions != null && impressions !== ""
  return {
    id: ad.id,
    platform: "LinkedIn",
    advertiser: ad.advertiser || ad.poster || "Advertiser",
    subtitle: ad.posterTitle ?? "Promoted",
    headline: ad.headline ?? null,
    description: ad.description ?? null,
    imageUrl: ad.image ?? null,
    videoUrl: ad.video ?? null,
    destinationUrl: ad.destinationUrl ?? null,
    cta: ad.cta ?? null,
    dateLabel:
      ad.adDuration ??
      (ad.startDate ? `${ad.startDate} – ${ad.endDate ?? "–"}` : null),
    stats: hasImpressions
      ? [
          {
            label: "Impressions",
            value:
              typeof impressions === "number"
                ? impressions.toLocaleString()
                : impressions,
          },
        ]
      : undefined,
    impressions: typeof impressions === "number" ? impressions : 0,
  }
}
