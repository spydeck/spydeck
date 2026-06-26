import type { NormalizedAd } from "../../_components/normalized-ad"

export interface MetaAdResult {
  ad_archive_id: string
  page_name: string
  is_active: boolean
  publisher_platform: string[]
  start_date_string: string
  end_date_string: string
  spend?: { lower_bound?: string; upper_bound?: string }
  snapshot: {
    title?: string
    body?: { markup?: { __html: string }; text?: string }
    cta_text?: string
    images?: { original_image_url?: string }[]
    videos?: { video_hd_url?: string; video_preview_image_url?: string }[]
    link_url?: string
    page_name?: string
  }
}

export interface MetaAdsResponse {
  searchResults: MetaAdResult[]
  searchResultsCount?: number
  cursor?: string
}

export function normalizeMetaAd(ad: MetaAdResult): NormalizedAd {
  const snap = ad.snapshot
  const video = snap.videos?.[0]
  const image = snap.images?.[0]?.original_image_url
  const stats: NormalizedAd["stats"] = []
  if (ad.publisher_platform?.length) {
    stats.push({ label: "Platforms", value: ad.publisher_platform.join(", ") })
  }
  if (ad.spend?.lower_bound || ad.spend?.upper_bound) {
    stats.push({
      label: "Spend",
      value: `$${ad.spend.lower_bound ?? "?"}–$${ad.spend.upper_bound ?? "?"}`,
    })
  }

  return {
    id: ad.ad_archive_id,
    platform: "Meta",
    advertiser: snap.page_name || ad.page_name || "Advertiser",
    subtitle: ad.is_active ? "Active" : "Inactive",
    headline: snap.title ?? null,
    description: snap.body?.text ?? null,
    imageUrl: video?.video_preview_image_url ?? image ?? null,
    videoUrl: video?.video_hd_url ?? null,
    destinationUrl: snap.link_url ?? null,
    cta: snap.cta_text ?? null,
    dateLabel: ad.start_date_string
      ? `${ad.start_date_string} – ${ad.end_date_string ?? "–"}`
      : null,
    stats: stats.length > 0 ? stats : undefined,
  }
}
