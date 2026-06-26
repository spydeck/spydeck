"use client"

import { useState } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { AdsResults } from "../../_components/ads-results"
import { AdsSkeleton, AdsEmptyState } from "../../_components/ads-states"
import { LinkedInForm, defaultForm, type FormState } from "./linkedin-form"
import { normalizeLinkedInAd, type LinkedInAdsResponse } from "./linkedin-ad"

export function LinkedInAdsPanel() {
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
    queryKey: ["linkedin-ads", submittedParams],
    queryFn: ({ pageParam }) => {
      const p = submittedParams!
      const params = new URLSearchParams()
      if (p.company) params.set("company", p.company)
      if (p.keyword) params.set("keyword", p.keyword)
      if (p.companyId) params.set("companyId", p.companyId)
      if (p.countries) params.set("countries", p.countries)
      if (p.startDate) params.set("startDate", p.startDate)
      if (p.endDate) params.set("endDate", p.endDate)
      if (pageParam) params.set("paginationToken", pageParam)
      return apiFetch<LinkedInAdsResponse>(`/ads/linkedin?${params.toString()}`)
    },
    initialPageParam: "",
    getNextPageParam: (lastPage) =>
      lastPage.isLastPage ? undefined : lastPage.paginationToken,
    enabled: !!submittedParams,
  })

  const ads = (data?.pages.flatMap((page) => page.ads) ?? []).map(normalizeLinkedInAd)
  const totalAds = data?.pages[0]?.totalAds

  const hasAnyInput =
    form.company.trim() || form.keyword.trim() || form.companyId.trim()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasAnyInput) return
    setSubmittedParams({ ...form })
  }

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex flex-col gap-6">
      <LinkedInForm
        form={form}
        onChange={setField}
        onSubmit={handleSubmit}
        canSubmit={!!hasAnyInput}
      />

      {isLoading && <AdsSkeleton />}

      {isError && (
        <p className="text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load LinkedIn ads."}
        </p>
      )}

      {!isLoading && !isError && data && ads.length === 0 && (
        <AdsEmptyState message="No LinkedIn ads found for this search." />
      )}

      {!isLoading && !isError && data && ads.length > 0 && (
        <AdsResults
          ads={ads}
          total={totalAds}
          resetKey={submittedParams}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      )}

      {!submittedParams && (
        <AdsEmptyState message="Enter a company name, keyword, or company ID to search LinkedIn ads." />
      )}
    </div>
  )
}
