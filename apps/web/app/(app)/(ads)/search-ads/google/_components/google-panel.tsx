"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { AdsResults } from "../../_components/ads-results"
import { AdsSkeleton, AdsEmptyState } from "../../_components/ads-states"
import { GoogleForm } from "./google-form"
import {
  defaultGoogleForm,
  normalizeGoogleAd,
  type Advertiser,
  type GoogleAdsResponse,
  type GoogleCreative,
  type GoogleForm as GoogleFormState,
} from "./google-ad"

export function GoogleAdsPanel() {
  const [form, setForm] = useState<GoogleFormState>(defaultGoogleForm)
  const [submitted, setSubmitted] = useState<GoogleFormState | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["google-ads", submitted],
    queryFn: () => {
      const p = submitted!
      const params = new URLSearchParams()
      if (p.advertiserId) params.set("advertiser_id", p.advertiserId)
      else if (p.domain.trim()) params.set("domain", p.domain.trim())
      if (p.region) params.set("region", p.region)
      if (p.format) params.set("format", p.format)
      if (p.startDate) params.set("start_date", p.startDate)
      if (p.endDate) params.set("end_date", p.endDate)
      return apiFetch<GoogleAdsResponse>(`/ads/google/company-ads?${params.toString()}`)
    },
    enabled: !!submitted,
  })

  const rawAds = data?.ads ?? []

  // Google's list returns no media for video ads — resolve it in one batch call.
  const videoUrls = rawAds
    .filter((a) => a.format?.toLowerCase() === "video" && !a.imageUrl)
    .map((a) => a.adUrl)
  const { data: creatives } = useQuery({
    queryKey: ["google-creatives", videoUrls],
    queryFn: () =>
      apiFetch<Record<string, GoogleCreative>>("/ads/google/creatives", {
        method: "POST",
        body: JSON.stringify({ urls: videoUrls }),
      }),
    enabled: videoUrls.length > 0,
    staleTime: Infinity,
  })

  const ads = rawAds.map((a) => {
    const n = normalizeGoogleAd(a)
    const c = creatives?.[a.creativeId]
    if (c?.videoUrl) {
      n.videoUrl = c.videoUrl
      const ytId = c.videoUrl.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1]
      n.imageUrl =
        n.imageUrl ??
        c.imageUrl ??
        (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : null)
    }
    return n
  })
  const canSubmit = !!(form.advertiserId || form.domain.trim())

  function setField(field: keyof GoogleFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Picking an advertiser clears the domain (they're alternative lookups).
  function onAdvertiser(a: Advertiser | null) {
    setForm((prev) => ({
      ...prev,
      advertiserId: a?.advertiser_id ?? "",
      advertiserName: a?.name ?? "",
      region: a?.region || prev.region,
      domain: a ? "" : prev.domain,
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitted({ ...form })
  }

  return (
    <div className="flex flex-col gap-6">
      <GoogleForm
        form={form}
        onChange={setField}
        onAdvertiser={onAdvertiser}
        onSubmit={handleSubmit}
        canSubmit={canSubmit}
      />

      {isLoading && <AdsSkeleton />}

      {isError && (
        <p className="text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load Google ads."}
        </p>
      )}

      {!isLoading && !isError && data && ads.length === 0 && (
        <AdsEmptyState message="No ads found for this search." />
      )}

      {!isLoading && !isError && ads.length > 0 && (
        <AdsResults ads={ads} rawAds={rawAds} platform="Google" resetKey={submitted} />
      )}

      {!submitted && (
        <AdsEmptyState message="Search a company by name or enter a domain to browse Google ads." />
      )}
    </div>
  )
}
