import type { NormalizedAd } from "../../_components/normalized-ad"

export interface TikTokAd {
  id: string
  ad_title: string
  brand_name: string
  like: number
  ctr: number
  cost: number
  industry_key: string
  objective_key: string
  video_info: {
    cover: string
    duration: number
    video_url: string
  }
}

export interface TikTokAdsResponse {
  ads: TikTokAd[]
  cursor: number
}

export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

export function normalizeTikTokAd(ad: TikTokAd): NormalizedAd {
  return {
    id: ad.id,
    platform: "TikTok",
    advertiser: ad.brand_name || "Advertiser",
    subtitle: ad.industry_key || null,
    headline: ad.ad_title ?? null,
    description: null,
    imageUrl: ad.video_info?.cover ?? null,
    videoUrl: ad.video_info?.video_url ?? null,
    dateLabel: null,
    stats: [
      { label: "Likes", value: formatCompact(ad.like) },
      { label: "CTR", value: `${(ad.ctr * 100).toFixed(1)}%` },
      { label: "Cost", value: `$${formatCompact(ad.cost)}` },
    ],
    impressions: ad.like,
  }
}
