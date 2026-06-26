"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { SearchIcon } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdsResults } from "../../_components/ads-results"
import { AdsSkeleton, AdsEmptyState } from "../../_components/ads-states"
import { GoogleAdvertiserSearch } from "./google-advertiser-search"
import {
  defaultAdsForm,
  normalizeGoogleAd,
  type Advertiser,
  type AdsForm,
  type GoogleAdsResponse,
} from "./google-ad"

export function GoogleAdsPanel() {
  const [selected, setSelected] = useState<Advertiser | null>(null)
  const [adsForm, setAdsForm] = useState<AdsForm>(defaultAdsForm)
  const [submitted, setSubmitted] = useState<{ advertiser: Advertiser; form: AdsForm } | null>(
    null
  )

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["google-ads", submitted],
    queryFn: () => {
      const { advertiser, form } = submitted!
      const params = new URLSearchParams()
      params.set("advertiser_id", advertiser.advertiser_id)
      if (advertiser.region) params.set("region", advertiser.region)
      if (form.start_date) params.set("start_date", form.start_date)
      if (form.end_date) params.set("end_date", form.end_date)
      if (form.platform) params.set("platform", form.platform)
      if (form.format) params.set("format", form.format)
      return apiFetch<GoogleAdsResponse>(`/ads/google/company-ads?${params.toString()}`)
    },
    enabled: !!submitted,
  })

  const rawAds = data?.ads ?? []
  const ads = rawAds.map(normalizeGoogleAd)

  function selectAdvertiser(advertiser: Advertiser) {
    setSelected(advertiser)
    setSubmitted({ advertiser, form: adsForm })
  }

  function loadAds(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setSubmitted({ advertiser: selected, form: adsForm })
  }

  function setField(field: keyof AdsForm, value: string) {
    setAdsForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex flex-col gap-6">
      <GoogleAdvertiserSearch
        selectedId={selected?.advertiser_id}
        onSelect={selectAdvertiser}
      />

      {selected && (
        <form onSubmit={loadAds} className="flex flex-col gap-3">
          <p className="text-sm font-medium">
            Step 2: Load ads for <span className="text-foreground">{selected.name}</span>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={adsForm.start_date}
              onChange={(e) => setField("start_date", e.target.value)}
              placeholder="Start date (YYYY-MM-DD)"
              className="w-full sm:w-48"
            />
            <Input
              value={adsForm.end_date}
              onChange={(e) => setField("end_date", e.target.value)}
              placeholder="End date (YYYY-MM-DD)"
              className="w-full sm:w-48"
            />
            <Input
              value={adsForm.platform}
              onChange={(e) => setField("platform", e.target.value)}
              placeholder="Platform (optional)"
              className="w-full sm:w-36"
            />
            <Input
              value={adsForm.format}
              onChange={(e) => setField("format", e.target.value)}
              placeholder="Format (optional)"
              className="w-full sm:w-36"
            />
            <Button type="submit">
              <SearchIcon data-icon="inline-start" />
              Load Ads
            </Button>
          </div>
        </form>
      )}

      {isLoading && <AdsSkeleton />}

      {isError && (
        <p className="text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load Google ads."}
        </p>
      )}

      {selected && !isLoading && !isError && data && ads.length === 0 && (
        <AdsEmptyState message="No ads found for this advertiser." />
      )}

      {!isLoading && !isError && ads.length > 0 && (
        <AdsResults
          ads={ads}
          rawAds={rawAds}
          platform="Google"
          resetKey={submitted}
        />
      )}

      {!selected && (
        <AdsEmptyState message="Search for an advertiser to browse their Google ads." />
      )}
    </div>
  )
}
