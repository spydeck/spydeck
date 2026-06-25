"use client"

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
import { CountrySelect } from "@/components/country-select"

interface MetaAdResult {
  ad_archive_id: string
  page_name: string
  is_active: boolean
  publisher_platform: string[]
  start_date_string: string
  end_date_string: string
  spend?: { lower_bound?: string; upper_bound?: string }
  snapshot: {
    title?: string
    body?: { markup?: { __html: string }; text?: string }
    cta_text?: string
    images?: { original_image_url?: string }[]
    videos?: { video_hd_url?: string; video_preview_image_url?: string }[]
    link_url?: string
    page_name?: string
  }
}

interface MetaAdsResponse {
  searchResults: MetaAdResult[]
  searchResultsCount?: number
  cursor?: string
}

interface FormState {
  query: string
  country: string
  status: string
  media_type: string
  ad_type: string
  start_date: string
  end_date: string
}

const defaultForm: FormState = {
  query: "",
  country: "",
  status: "ALL",
  media_type: "ALL",
  ad_type: "ALL",
  start_date: "",
  end_date: "",
}

export function MetaAdsSearchPanel() {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [submittedParams, setSubmittedParams] = useState<FormState | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["meta-ads", submittedParams],
    queryFn: () => {
      const params = new URLSearchParams()
      if (submittedParams!.query) params.set("query", submittedParams!.query)
      if (submittedParams!.country) params.set("country", submittedParams!.country)
      if (submittedParams!.status !== "ALL") params.set("status", submittedParams!.status)
      if (submittedParams!.media_type !== "ALL") params.set("media_type", submittedParams!.media_type)
      if (submittedParams!.ad_type !== "ALL") params.set("ad_type", submittedParams!.ad_type)
      if (submittedParams!.start_date) params.set("start_date", submittedParams!.start_date)
      if (submittedParams!.end_date) params.set("end_date", submittedParams!.end_date)
      return apiFetch<MetaAdsResponse>(`/ads/meta?${params.toString()}`)
    },
    enabled: !!submittedParams,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.query.trim()) return
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
              placeholder="Search Meta ads..."
              className="pl-8"
              aria-label="Search query"
            />
          </div>
          <CountrySelect
            value={form.country}
            onChange={(v) => set("country", v)}
            placeholder="Country"
            allowEmpty
            className="w-full sm:w-36"
          />
          <Button type="submit" disabled={!form.query.trim()}>
            <SearchIcon data-icon="inline-start" />
            Search
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={form.media_type} onValueChange={(v) => set("media_type", v)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Media type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All media</SelectItem>
              <SelectItem value="IMAGE">Image</SelectItem>
              <SelectItem value="VIDEO">Video</SelectItem>
              <SelectItem value="MEME">Meme</SelectItem>
            </SelectContent>
          </Select>

          <Select value={form.ad_type} onValueChange={(v) => set("ad_type", v)}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Ad type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="POLITICAL_AND_ISSUE_ADS">Political & Issue</SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={form.start_date}
            onChange={(e) => set("start_date", e.target.value)}
            placeholder="Start date (YYYY-MM-DD)"
            className="w-full sm:w-48"
            aria-label="Start date"
          />
          <Input
            value={form.end_date}
            onChange={(e) => set("end_date", e.target.value)}
            placeholder="End date (YYYY-MM-DD)"
            className="w-full sm:w-48"
            aria-label="End date"
          />
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
          {error instanceof Error ? error.message : "Failed to load Meta ads."}
        </p>
      )}

      {!isLoading && !isError && data && data.searchResults.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MegaphoneIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No Meta ads found for this search.</p>
        </div>
      )}

      {!isLoading && !isError && data && data.searchResults.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {(data.searchResultsCount ?? data.searchResults.length).toLocaleString()} results
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.searchResults.map((ad) => {
              const bodyText = ad.snapshot.body?.text ?? ""
              const video = ad.snapshot.videos?.[0]
              const imageUrl = ad.snapshot.images?.[0]?.original_image_url
              return (
                <Card key={ad.ad_archive_id} className="rounded-xl overflow-hidden">
                  {video?.video_hd_url ? (
                    <video
                      src={video.video_hd_url}
                      poster={video.video_preview_image_url}
                      controls
                      preload="metadata"
                      className="h-48 w-full bg-muted object-cover"
                    />
                  ) : imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={ad.snapshot.title ?? ad.page_name}
                      className="h-48 w-full bg-muted object-cover"
                    />
                  ) : null}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">
                        {ad.snapshot.title ?? ad.page_name}
                      </CardTitle>
                      <Badge variant={ad.is_active ? "secondary" : "outline"}>
                        {ad.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-foreground">{ad.page_name}</p>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                    {bodyText && <p className="line-clamp-3">{bodyText}</p>}
                    {ad.snapshot.cta_text && (
                      <Badge variant="outline" className="w-fit">{ad.snapshot.cta_text}</Badge>
                    )}
                  </CardContent>
                  <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{ad.start_date_string} – {ad.end_date_string}</span>
                    <span>{ad.publisher_platform.join(", ")}</span>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {!submittedParams && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <MegaphoneIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Enter a search query and click Search to find Meta ads.
          </p>
        </div>
      )}
    </div>
  )
}
