"use client"

import { useMemo, useState } from "react"
import { MegaphoneIcon, SearchIcon } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
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
import {
  mockAds,
  platformOptions,
  statusOptions,
  type AdPlatform,
  type AdStatus,
} from "./_components/mock-ads"

const statusVariant: Record<AdStatus, "secondary" | "outline"> = {
  Active: "secondary",
  Paused: "outline",
  Ended: "outline",
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return String(value)
}

export default function SearchAdsPage() {
  const [query, setQuery] = useState("")
  const [platform, setPlatform] = useState<AdPlatform | "all">("all")
  const [status, setStatus] = useState<AdStatus | "all">("all")

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return mockAds.filter((ad) => {
      const matchesQuery =
        !q ||
        ad.title.toLowerCase().includes(q) ||
        ad.advertiser.toLowerCase().includes(q) ||
        ad.description.toLowerCase().includes(q)
      const matchesPlatform = platform === "all" || ad.platform === platform
      const matchesStatus = status === "all" || ad.status === status
      return matchesQuery && matchesPlatform && matchesStatus
    })
  }, [query, platform, status])

  const hasFilters = query !== "" || platform !== "all" || status !== "all"

  function resetFilters() {
    setQuery("")
    setPlatform("all")
    setStatus("all")
  }

  return (
    <>
      <SiteHeader title="Search Ads" />
      <div className="flex flex-1 flex-col gap-6 px-4 py-10">
        <div>
          <h1 className="text-xl font-semibold">Search Ads</h1>
          <p className="text-sm text-muted-foreground">
            Browse and filter ads from across platforms.
          </p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, advertiser, or description"
              className="pl-8"
              aria-label="Search ads"
            />
          </div>
          <Select
            value={platform}
            onValueChange={(v) => setPlatform(v as AdPlatform | "all")}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              {platformOptions.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as AdStatus | "all")}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters ? (
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          ) : null}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          {results.length} {results.length === 1 ? "result" : "results"}
        </p>

        {/* Results grid */}
        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <MegaphoneIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No ads match your filters. Try adjusting your search.
            </p>
            {hasFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((ad) => (
              <Card key={ad.id} className="rounded-xl">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{ad.title}</CardTitle>
                    <Badge variant={statusVariant[ad.status]}>{ad.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {ad.advertiser}
                    </span>
                    <span>·</span>
                    <span>{ad.platform}</span>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="line-clamp-3">{ad.description}</p>
                </CardContent>
                <CardFooter className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{ad.date}</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <span className="text-muted-foreground">Imp.</span>
                      <span className="font-medium">
                        {formatCompact(ad.impressions)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-muted-foreground">Spend</span>
                      <span className="font-medium">
                        ${formatCompact(ad.spend)}
                      </span>
                    </span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}