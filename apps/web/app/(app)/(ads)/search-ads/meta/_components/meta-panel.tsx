"use client"

import { useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { AdsResults } from "../../_components/ads-results"
import { AdsSkeleton, AdsEmptyState } from "../../_components/ads-states"
import { MetaForm, defaultForm, type FormState } from "./meta-form"
import { normalizeMetaAd, type MetaAdsResponse } from "./meta-ad"

export function MetaAdsPanel() {
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
    queryKey: ["meta-ads", submittedParams],
    queryFn: ({ pageParam }) => {
      const p = submittedParams!
      const params = new URLSearchParams()
      if (p.query) params.set("query", p.query)
      if (p.country) params.set("country", p.country)
      if (p.status !== "ALL") params.set("status", p.status)
      if (p.media_type !== "ALL") params.set("media_type", p.media_type)
      if (p.ad_type !== "ALL") params.set("ad_type", p.ad_type)
      if (p.start_date) params.set("start_date", p.start_date)
      if (p.end_date) params.set("end_date", p.end_date)
      if (pageParam) params.set("cursor", pageParam)
      return apiFetch<MetaAdsResponse>(`/ads/meta?${params.toString()}`)
    },
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.cursor || undefined,
    enabled: !!submittedParams,
  })

  const ads = (data?.pages.flatMap((page) => page.searchResults) ?? []).map(
    normalizeMetaAd
  )
  const total = data?.pages[0]?.searchResultsCount

  const canSubmit = form.query.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmittedParams({ ...form })
  }

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex flex-col gap-6">
      <MetaForm
        form={form}
        onChange={setField}
        onSubmit={handleSubmit}
        canSubmit={canSubmit}
      />

      {isLoading && <AdsSkeleton />}

      {isError && (
        <p className="text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load Meta ads."}
        </p>
      )}

      {!isLoading && !isError && data && ads.length === 0 && (
        <AdsEmptyState message="No Meta ads found for this search." />
      )}

      {!isLoading && !isError && data && ads.length > 0 && (
        <AdsResults
          ads={ads}
          total={total}
          resetKey={submittedParams}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      )}

      {!submittedParams && (
        <AdsEmptyState message="Enter a search query and click Search to find Meta ads." />
      )}
    </div>
  )
}
