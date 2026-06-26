import type { NormalizedAd } from "../../_components/normalized-ad"

interface MetaImage {
  original_image_url?: string
  resized_image_url?: string
  watermarked_resized_image_url?: string
}

interface MetaVideo {
  video_hd_url?: string
  video_sd_url?: string
  video_preview_image_url?: string
}

interface MetaCard {
  original_image_url?: string
  resized_image_url?: string
  video_hd_url?: string
  video_sd_url?: string
  video_preview_image_url?: string
}

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
    images?: MetaImage[]
    videos?: MetaVideo[]
    cards?: MetaCard[]
    extra_images?: MetaImage[]
    extra_videos?: MetaVideo[]
    link_url?: string
    page_name?: string
  }
}

export interface MetaAdsResponse {
  searchResults: MetaAdResult[]
  searchResultsCount?: number
  cursor?: string
}

function pickImage(img: MetaImage | MetaCard | undefined): string | undefined {
  if (!img) return undefined
  return img.original_image_url || img.resized_image_url || undefined
}

function pickVideo(
  vid: MetaVideo | MetaCard | undefined,
): { videoUrl?: string; posterUrl?: string } {
  if (!vid) return {}
  return {
    videoUrl: vid.video_hd_url || vid.video_sd_url || undefined,
    posterUrl: vid.video_preview_image_url || undefined,
  }
}

export function normalizeMetaAd(ad: MetaAdResult): NormalizedAd {
  const snap = ad.snapshot

  // Try videos first (top-level, then extras, then cards), falling back to images.
  const directVideo = pickVideo(snap.videos?.[0])
  const extraVideo =
    !directVideo.videoUrl ? pickVideo(snap.extra_videos?.[0]) : { videoUrl: undefined, posterUrl: undefined }
  const cardVideo = (() => {
    if (directVideo.videoUrl || extraVideo.videoUrl) return { videoUrl: undefined, posterUrl: undefined }
    const c = snap.cards?.find((card) => card.video_hd_url || card.video_sd_url)
    return pickVideo(c)
  })()
  const videoUrl = directVideo.videoUrl ?? extraVideo.videoUrl ?? cardVideo.videoUrl ?? null

  const directImage = pickImage(snap.images?.[0])
  const extraImage = pickImage(snap.extra_images?.[0])
  const cardImage = pickImage(snap.cards?.find((c) => c.original_image_url || c.resized_image_url))
  const poster = directVideo.posterUrl ?? extraVideo.posterUrl ?? cardVideo.posterUrl
  const imageUrl = poster ?? directImage ?? extraImage ?? cardImage ?? null

  const stats: NormalizedAd["stats"] = []
  if (ad.publisher_platform?.length) {
    stats.push({ label: "Platforms", value: ad.publisher_platform.join(",") })
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
    imageUrl,
    videoUrl,
    destinationUrl: snap.link_url ?? null,
    cta: snap.cta_text ?? null,
    dateLabel: ad.start_date_string
      ? `${ad.start_date_string} – ${ad.end_date_string ?? "–"}`
      : null,
    stats: stats.length > 0 ? stats : undefined,
  }
}
