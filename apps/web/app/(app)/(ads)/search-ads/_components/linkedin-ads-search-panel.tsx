"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { SearchIcon, MegaphoneIcon } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

interface LinkedInAd {
  id: string
  description?: string
  headline?: string
  adType: string
  advertiser: string
  advertiserLinkedinPage?: string
  cta?: string
  destinationUrl?: string
  image?: string
  startDate?: string
  endDate?: string
  totalImpressions?: number | string
}

interface LinkedInAdsResponse {
  ads: LinkedInAd[]
  paginationToken?: string
}

interface FormState {
  company: string
  keyword: string
  companyId: string
  countries: string
  startDate: string
  endDate: string
}

const defaultForm: FormState = {
  company: "",
  keyword: "",
  companyId: "",
  countries: "",
  startDate: "",
  endDate: "",
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

export function LinkedInAdsSearchPanel() {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [submittedParams, setSubmittedParams] = useState<FormState | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["linkedin-ads", submittedParams],
    queryFn: () => {
      const params = new URLSearchParams()
      if (submittedParams!.company) params.set("company", submittedParams!.company)
      if (submittedParams!.keyword) params.set("keyword", submittedParams!.keyword)
      if (submittedParams!.companyId) params.set("companyId", submittedParams!.companyId)
      if (submittedParams!.countries) params.set("countries", submittedParams!.countries)
      if (submittedParams!.startDate) params.set("startDate", submittedParams!.startDate)
      if (submittedParams!.endDate) params.set("endDate", submittedParams!.endDate)
      return apiFetch<LinkedInAdsResponse>(`/ads/linkedin?${params.toString()}`)
    },
    enabled: !!submittedParams,
  })

  const hasAnyInput =
    form.company.trim() ||
    form.keyword.trim() ||
    form.companyId.trim()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasAnyInput) return
    setSubmittedParams({ ...form })
  }

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
              placeholder="Company name"
              className="pl-8"
              aria-label="Company name"
            />
          </div>
          <Input
            value={form.keyword}
            onChange={(e) => set("keyword", e.target.value)}
            placeholder="Keyword"
            className="w-full sm:w-44"
            aria-label="Keyword"
          />
          <Input
            value={form.companyId}
            onChange={(e) => set("companyId", e.target.value)}
            placeholder="Company ID"
            className="w-full sm:w-36"
            aria-label="Company ID"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            value={form.countries}
            onChange={(e) => set("countries", e.target.value)}
            placeholder="Countries (US,CA)"
            className="w-full sm:w-40"
            aria-label="Countries"
          />
          <Input
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            placeholder="Start date (YYYY-MM-DD)"
            className="w-full sm:w-48"
            aria-label="Start date"
          />
          <Input
            value={form.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            placeholder="End date (YYYY-MM-DD)"
            className="w-full sm:w-48"
            aria-label="End date"
          />
          <Button type="submit" disabled={!hasAnyInput}>
            <SearchIcon data-icon="inline-start" />
            Search
          </Button>
        </div>
      </form>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-xl">
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/3" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load LinkedIn ads."}
        </p>
      )}

      {!isLoading && !isError && data && data.ads.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MegaphoneIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No LinkedIn ads found for this search.</p>
        </div>
      )}

      {!isLoading && !isError && data && data.ads.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.ads.map((ad) => (
            <Card key={ad.id} className="rounded-xl">
              {ad.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.image}
                  alt={ad.headline ?? ad.advertiser}
                  className="h-40 w-full rounded-t-xl object-cover"
                />
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">
                    {ad.headline ?? ad.advertiser}
                  </CardTitle>
                  <Badge variant="outline">{ad.adType}</Badge>
                </div>
                <p className="text-xs font-medium text-foreground">{ad.advertiser}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                {ad.description && (
                  <p className="line-clamp-3">{ad.description}</p>
                )}
                {ad.cta && (
                  <Badge variant="secondary" className="w-fit">{ad.cta}</Badge>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {ad.startDate ?? "–"} – {ad.endDate ?? "–"}
                </span>
                {ad.totalImpressions !== undefined && ad.totalImpressions !== null && (
                  <span className="flex items-center gap-1">
                    <span>Imp.</span>
                    <span className="font-medium text-foreground">
                      {typeof ad.totalImpressions === "number"
                        ? formatCompact(ad.totalImpressions)
                        : ad.totalImpressions}
                    </span>
                  </span>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!submittedParams && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MegaphoneIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Enter a company name, keyword, or company ID to search LinkedIn ads.
          </p>
        </div>
      )}
    </div>
  )
}
