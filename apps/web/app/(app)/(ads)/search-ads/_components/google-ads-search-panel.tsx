"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { SearchIcon, MegaphoneIcon, ExternalLinkIcon } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { CountrySelect } from "@/components/country-select"

interface Advertiser {
  name: string
  advertiser_id: string
  region: string
  number_of_ads_estimate: number
}

interface AdvertisersResponse {
  advertisers: Advertiser[]
}

interface GoogleAd {
  advertiserId: string
  creativeId: string
  format: string
  adUrl: string
  advertiserName: string
  imageUrl?: string
  firstShown: string
  lastShown: string
}

interface GoogleAdsResponse {
  ads: GoogleAd[]
  cursor?: string
}

interface SearchForm {
  query: string
  region: string
}

interface AdsForm {
  start_date: string
  end_date: string
  platform: string
  format: string
}

const defaultAdsForm: AdsForm = {
  start_date: "",
  end_date: "",
  platform: "",
  format: "",
}

export function GoogleAdsSearchPanel() {
  const [searchForm, setSearchForm] = useState<SearchForm>({ query: "", region: "" })
  const [submittedQuery, setSubmittedQuery] = useState<SearchForm | null>(null)
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<Advertiser | null>(null)
  const [adsForm, setAdsForm] = useState<AdsForm>(defaultAdsForm)
  const [submittedAdsParams, setSubmittedAdsParams] = useState<{ advertiser: Advertiser; form: AdsForm } | null>(null)

  const advertiserQuery = useQuery({
    queryKey: ["google-advertisers", submittedQuery],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set("query", submittedQuery!.query)
      if (submittedQuery!.region) params.set("region", submittedQuery!.region)
      return apiFetch<AdvertisersResponse>(`/ads/google/advertisers?${params.toString()}`)
    },
    enabled: !!submittedQuery,
  })

  const adsQuery = useQuery({
    queryKey: ["google-ads", submittedAdsParams],
    queryFn: () => {
      const { advertiser, form } = submittedAdsParams!
      const params = new URLSearchParams()
      params.set("advertiser_id", advertiser.advertiser_id)
      if (advertiser.region) params.set("region", advertiser.region)
      if (form.start_date) params.set("start_date", form.start_date)
      if (form.end_date) params.set("end_date", form.end_date)
      if (form.platform) params.set("platform", form.platform)
      if (form.format) params.set("format", form.format)
      return apiFetch<GoogleAdsResponse>(`/ads/google/company-ads?${params.toString()}`)
    },
    enabled: !!submittedAdsParams,
  })

  function handleAdvertiserSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchForm.query.trim()) return
    setSelectedAdvertiser(null)
    setSubmittedAdsParams(null)
    setSubmittedQuery({ ...searchForm })
  }

  function handleSelectAdvertiser(advertiser: Advertiser) {
    setSelectedAdvertiser(advertiser)
    setSubmittedAdsParams({ advertiser, form: adsForm })
  }

  function handleAdsSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAdvertiser) return
    setSubmittedAdsParams({ advertiser: selectedAdvertiser, form: adsForm })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step 1: advertiser search */}
      <form onSubmit={handleAdvertiserSearch} className="flex flex-col gap-3">
        <p className="text-sm font-medium">Step 1: Find advertiser</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchForm.query}
              onChange={(e) => setSearchForm((p) => ({ ...p, query: e.target.value }))}
              placeholder="Advertiser name..."
              className="pl-8"
              aria-label="Advertiser name"
            />
          </div>
          <CountrySelect
            value={searchForm.region}
            onChange={(v) => setSearchForm((p) => ({ ...p, region: v }))}
            placeholder="Region"
            allowEmpty
            className="w-full sm:w-36"
          />
          <Button type="submit" disabled={!searchForm.query.trim()}>
            <SearchIcon data-icon="inline-start" />
            Find
          </Button>
        </div>
      </form>

      {/* Advertiser results */}
      {advertiserQuery.isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {advertiserQuery.isError && (
        <p className="text-sm text-destructive">
          {advertiserQuery.error instanceof Error ? advertiserQuery.error.message : "Failed to search advertisers."}
        </p>
      )}

      {!advertiserQuery.isLoading && advertiserQuery.data && advertiserQuery.data.advertisers.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Select an advertiser</p>
          {advertiserQuery.data.advertisers.map((adv) => (
            <div
              key={adv.advertiser_id}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{adv.name}</span>
                <span className="text-xs text-muted-foreground">
                  {adv.region} · ~{adv.number_of_ads_estimate.toLocaleString()} ads
                </span>
              </div>
              <Button
                variant={selectedAdvertiser?.advertiser_id === adv.advertiser_id ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleSelectAdvertiser(adv)}
              >
                {selectedAdvertiser?.advertiser_id === adv.advertiser_id ? "Selected" : "Select"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {!advertiserQuery.isLoading && advertiserQuery.data && advertiserQuery.data.advertisers.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">No advertisers found. Try a different name.</p>
      )}

      {/* Step 2: filter ads */}
      {selectedAdvertiser && (
        <form onSubmit={handleAdsSearch} className="flex flex-col gap-3">
          <p className="text-sm font-medium">
            Step 2: Load ads for <span className="text-foreground">{selectedAdvertiser.name}</span>
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={adsForm.start_date}
              onChange={(e) => setAdsForm((p) => ({ ...p, start_date: e.target.value }))}
              placeholder="Start date (YYYY-MM-DD)"
              className="w-full sm:w-48"
            />
            <Input
              value={adsForm.end_date}
              onChange={(e) => setAdsForm((p) => ({ ...p, end_date: e.target.value }))}
              placeholder="End date (YYYY-MM-DD)"
              className="w-full sm:w-48"
            />
            <Input
              value={adsForm.platform}
              onChange={(e) => setAdsForm((p) => ({ ...p, platform: e.target.value }))}
              placeholder="Platform (optional)"
              className="w-full sm:w-36"
            />
            <Input
              value={adsForm.format}
              onChange={(e) => setAdsForm((p) => ({ ...p, format: e.target.value }))}
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

      {/* Ads results */}
      {adsQuery.isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-xl">
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/2" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {adsQuery.isError && (
        <p className="text-center text-sm text-destructive">
          {adsQuery.error instanceof Error ? adsQuery.error.message : "Failed to load Google ads."}
        </p>
      )}

      {!adsQuery.isLoading && !adsQuery.isError && adsQuery.data && adsQuery.data.ads.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MegaphoneIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No ads found for this advertiser.</p>
        </div>
      )}

      {!adsQuery.isLoading && !adsQuery.isError && adsQuery.data && adsQuery.data.ads.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adsQuery.data.ads.map((ad) => (
            <Card key={ad.creativeId} className="rounded-xl">
              {ad.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.imageUrl}
                  alt={ad.advertiserName}
                  className="h-40 w-full rounded-t-xl object-cover"
                />
              )}
              <CardHeader>
                <CardTitle className="text-base">{ad.advertiserName}</CardTitle>
                <p className="text-xs text-muted-foreground">{ad.format}</p>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>First shown: {ad.firstShown}</p>
                <p>Last shown: {ad.lastShown}</p>
              </CardContent>
              <CardFooter>
                <a
                  href={ad.adUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  View ad <ExternalLinkIcon className="size-3" />
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!submittedQuery && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MegaphoneIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Search for an advertiser to browse their Google ads.
          </p>
        </div>
      )}
    </div>
  )
}
