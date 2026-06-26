"use client"

import { useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { AdsResults } from "../../_components/ads-results"
import { AdsSkeleton, AdsEmptyState } from "../../_components/ads-states"
import { TikTokForm, defaultForm, type FormState } from "./tiktok-form"
import { normalizeTikTokAd, type TikTokAdsResponse } from "./tiktok-ad"

export function TikTokAdsPanel() {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [submittedParams, setSubmittedParams] = useState<FormState | null>(null)

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["tiktok-ads", submittedParams],
    queryFn: ({ pageParam }) => {
      const p = submittedParams!
      const params = new URLSearchParams()
      if (p.query) params.set("query", p.query)
      if (p.region) params.set("region", p.region)
      if (p.period) params.set("period", p.period)
      if (p.order_by) params.set("order_by", p.order_by)
      if (p.ad_format !== "ALL") params.set("ad_format", p.ad_format)
      if (pageParam) params.set("cursor", String(pageParam))
      return apiFetch<TikTokAdsResponse>(`/ads/tiktok?${params.toString()}`)
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.ads.length > 0 ? lastPage.cursor : undefined,
    enabled: !!submittedParams,
  })

  const rawAds = data?.pages.flatMap((page) => page.ads) ?? []
  const ads = rawAds.map(normalizeTikTokAd)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmittedParams({ ...form })
  }

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex flex-col gap-6">
      <TikTokForm form={form} onChange={setField} onSubmit={handleSubmit} />

      {isLoading && <AdsSkeleton />}

      {isError && (
        <p className="text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load TikTok ads."}
        </p>
      )}

      {!isLoading && !isError && data && ads.length === 0 && (
        <AdsEmptyState message="No TikTok ads found for this search." />
      )}

      {!isLoading && !isError && data && ads.length > 0 && (
        <AdsResults
          ads={ads}
          rawAds={rawAds}
          platform="TikTok"
          resetKey={submittedParams}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      )}

      {!submittedParams && (
        <AdsEmptyState message="Click Search to find TikTok ads." />
      )}
    </div>
  )
}
