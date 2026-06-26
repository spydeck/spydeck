"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { SearchIcon } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { CountrySelect } from "@/components/country-select"
import type { Advertiser, AdvertisersResponse } from "./google-ad"

export function GoogleAdvertiserSearch({
  selectedId,
  onSelect,
}: {
  selectedId?: string
  onSelect: (advertiser: Advertiser) => void
}) {
  const [query, setQuery] = useState("")
  const [region, setRegion] = useState("")
  const [submitted, setSubmitted] = useState<{ query: string; region: string } | null>(
    null
  )

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["google-advertisers", submitted],
    queryFn: () => {
      const params = new URLSearchParams()
      params.set("query", submitted!.query)
      if (submitted!.region) params.set("region", submitted!.region)
      return apiFetch<AdvertisersResponse>(`/ads/google/advertisers?${params.toString()}`)
    },
    enabled: !!submitted,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSubmitted({ query, region })
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="text-sm font-medium">Step 1: Find advertiser</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Advertiser name..."
              className="pl-8"
              aria-label="Advertiser name"
            />
          </div>
          <CountrySelect
            value={region}
            onChange={setRegion}
            placeholder="Region"
            allowEmpty
            className="w-full sm:w-36"
          />
          <Button type="submit" disabled={!query.trim()}>
            <SearchIcon data-icon="inline-start" />
            Find
          </Button>
        </div>
      </form>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to search advertisers."}
        </p>
      )}

      {!isLoading && data && data.advertisers.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Select an advertiser</p>
          {data.advertisers.map((adv) => (
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
                variant={selectedId === adv.advertiser_id ? "secondary" : "outline"}
                size="sm"
                onClick={() => onSelect(adv)}
              >
                {selectedId === adv.advertiser_id ? "Selected" : "Select"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {!isLoading && data && data.advertisers.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No advertisers found. Try a different name.
        </p>
      )}
    </div>
  )
}
