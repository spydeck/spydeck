import type { NormalizedAd } from "../../_components/normalized-ad"

export interface Advertiser {
  name: string
  advertiser_id: string
  region: string
  number_of_ads_estimate: number
}

export interface AdvertisersResponse {
  advertisers: Advertiser[]
}

export interface GoogleAd {
  advertiserId: string
  creativeId: string
  format: string
  adUrl: string
  advertiserName: string
  imageUrl?: string
  firstShown: string
  lastShown: string
}

export interface GoogleAdsResponse {
  ads: GoogleAd[]
  cursor?: string
}

export interface AdsForm {
  start_date: string
  end_date: string
  platform: string
  format: string
}

export const defaultAdsForm: AdsForm = {
  start_date: "",
  end_date: "",
  platform: "",
  format: "",
}

export function normalizeGoogleAd(ad: GoogleAd): NormalizedAd {
  return {
    id: ad.creativeId,
    platform: "Google",
    advertiser: ad.advertiserName || "Advertiser",
    subtitle: ad.format || null,
    headline: null,
    description: null,
    imageUrl: ad.imageUrl ?? null,
    videoUrl: null,
    destinationUrl: ad.adUrl ?? null,
    cta: "View ad",
    dateLabel: ad.firstShown
      ? `${ad.firstShown} – ${ad.lastShown ?? "–"}`
      : null,
  }
}
