"use client"

// TODO: backend route /scrapecreators/ads/tiktok is not yet implemented

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { SearchIcon, MegaphoneIcon } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

interface TikTokAd {
  id: string
  ad_title: string
  brand_name: string
  like: number
  ctr: number
  cost: number
  industry_key: string
  objective_key: string
  video_info: {
    cover: string
    duration: number
    video_url: string
  }
}

interface TikTokAdsResponse {
  ads: TikTokAd[]
  cursor: number
}

interface FormState {
  query: string
  region: string
  period: string
  order_by: string
  ad_format: string
}

const defaultForm: FormState = {
  query: "",
  region: "US",
  period: "30",
  order_by: "for_you",
  ad_format: "ALL",
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

export function TikTokAdsSearchPanel() {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [submittedParams, setSubmittedParams] = useState<FormState | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tiktok-ads", submittedParams],
    queryFn: () => {
      const params = new URLSearchParams()
      if (submittedParams!.query) params.set("query", submittedParams!.query)
      if (submittedParams!.region) params.set("region", submittedParams!.region)
      if (submittedParams!.period) params.set("period", submittedParams!.period)
      if (submittedParams!.order_by) params.set("order_by", submittedParams!.order_by)
      if (submittedParams!.ad_format !== "ALL") params.set("ad_format", submittedParams!.ad_format)
      return apiFetch<TikTokAdsResponse>(`/scrapecreators/ads/tiktok?${params.toString()}`)
    },
    enabled: !!submittedParams,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmittedParams({ ...form })
  }

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={form.query}
              onChange={(e) => set("query", e.target.value)}
              placeholder="Keyword (optional)"
              className="pl-8"
              aria-label="Search query"
            />
          </div>
          <Input
            value={form.region}
            onChange={(e) => set("region", e.target.value)}
            placeholder="Region (US)"
            className="w-full sm:w-32"
            aria-label="Region code"
            maxLength={2}
          />
          <Button type="submit">
            <SearchIcon data-icon="inline-start" />
            Search
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={form.period} onValueChange={(v) => set("period", v)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="180">Last 180 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={form.order_by} onValueChange={(v) => set("order_by", v)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="for_you">For you</SelectItem>
              <SelectItem value="like">Likes</SelectItem>
              <SelectItem value="ctr">CTR</SelectItem>
              <SelectItem value="cost">Cost</SelectItem>
            </SelectContent>
          </Select>

          <Select value={form.ad_format} onValueChange={(v) => set("ad_format", v)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All formats</SelectItem>
              <SelectItem value="SINGLE_VIDEO">Single video</SelectItem>
              <SelectItem value="IMAGE">Image</SelectItem>
              <SelectItem value="SPARK_ADS">Spark ads</SelectItem>
            </SelectContent>
          </Select>
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
                <Skeleton className="h-32 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-2/3" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {isError && (
        <p className="text-center text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load TikTok ads."}
        </p>
      )}

      {!isLoading && !isError && data && data.ads.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MegaphoneIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No TikTok ads found for this search.</p>
        </div>
      )}

      {!isLoading && !isError && data && data.ads.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.ads.map((ad) => (
            <Card key={ad.id} className="rounded-xl">
              {ad.video_info.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.video_info.cover}
                  alt={ad.ad_title}
                  className="h-40 w-full rounded-t-xl object-cover"
                />
              )}
              <CardHeader>
                <CardTitle className="text-base">{ad.ad_title}</CardTitle>
                <p className="text-xs font-medium text-foreground">{ad.brand_name}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">{ad.industry_key}</Badge>
                  <Badge variant="outline">{ad.objective_key}</Badge>
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span>Likes</span>
                  <span className="font-medium text-foreground">{formatCompact(ad.like)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>CTR</span>
                  <span className="font-medium text-foreground">{(ad.ctr * 100).toFixed(1)}%</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>Cost</span>
                  <span className="font-medium text-foreground">${formatCompact(ad.cost)}</span>
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!submittedParams && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MegaphoneIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click Search to find TikTok ads.
          </p>
        </div>
      )}
    </div>
  )
}
