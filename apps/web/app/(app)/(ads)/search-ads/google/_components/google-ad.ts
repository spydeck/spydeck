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

// Media resolved per creative via the Apify batch endpoint.
export interface GoogleCreative {
  creativeId: string
  format: string | null
  videoUrl: string | null
  imageUrl: string | null
  headline: string | null
  clickUrl: string | null
}

export interface GoogleForm {
  advertiserId: string
  advertiserName: string
  domain: string
  region: string
  format: string // "" | "text" | "image" | "video"
  startDate: string
  endDate: string
}

export const defaultGoogleForm: GoogleForm = {
  advertiserId: "",
  advertiserName: "",
  domain: "",
  region: "",
  format: "",
  startDate: "",
  endDate: "",
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
