"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2Icon, PlusIcon, SearchIcon } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { AdvertiserPlatform, ChannelInput } from "@/lib/advertisers"

interface Row {
  externalId: string
  name: string
  logo: string | null
  url: string | null
  sub: string | null
}

const ENDPOINT: Record<Exclude<AdvertiserPlatform, "tiktok">, string> = {
  linkedin: "/ads/linkedin/companies",
  meta: "/ads/meta/companies",
  google: "/ads/google/advertisers",
}

function normalize(
  platform: AdvertiserPlatform,
  data: { companies?: unknown[]; advertisers?: unknown[] } | undefined
): Row[] {
  if (platform === "linkedin") {
    return ((data?.companies ?? []) as Array<Record<string, string | null>>).map(
      (c) => ({
        externalId: String(c.companyId),
        name: String(c.name),
        logo: c.logo ?? null,
        url: c.url ?? null,
        sub: [c.industry, c.location].filter(Boolean).join(" · ") || null,
      })
    )
  }
  if (platform === "meta") {
    return ((data?.companies ?? []) as Array<Record<string, string | null>>).map(
      (c) => ({
        externalId: String(c.pageId),
        name: String(c.name),
        logo: c.logo ?? null,
        url: null,
        sub: c.category ?? null,
      })
    )
  }
  return ((data?.advertisers ?? []) as Array<Record<string, string>>).map((a) => ({
    externalId: String(a.advertiser_id),
    name: String(a.name),
    logo: null,
    url: `https://adstransparency.google.com/advertiser/${a.advertiser_id}`,
    sub: a.region ?? null,
  }))
}

export function ChannelPicker({
  onPick,
}: {
  onPick: (channel: ChannelInput) => void
}) {
  const [platform, setPlatform] = React.useState<AdvertiserPlatform>("linkedin")
  const [term, setTerm] = React.useState("")
  const [debounced, setDebounced] = React.useState("")

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 350)
    return () => clearTimeout(t)
  }, [term])

  const isSearch = platform !== "tiktok"
  const { data, isFetching } = useQuery({
    queryKey: ["channel-search", platform, debounced],
    queryFn: () =>
      apiFetch<{ companies?: unknown[]; advertisers?: unknown[] }>(
        `${ENDPOINT[platform as Exclude<AdvertiserPlatform, "tiktok">]}?query=${encodeURIComponent(debounced)}`
      ),
    enabled: isSearch && debounced.length >= 2,
    staleTime: 5 * 60 * 1000,
  })
  const rows = isSearch ? normalize(platform, data) : []

  function changePlatform(p: AdvertiserPlatform) {
    setPlatform(p)
    setTerm("")
    setDebounced("")
  }

  return (
    <div className="flex flex-col gap-2">
      <Tabs value={platform} onValueChange={(v) => changePlatform(v as AdvertiserPlatform)}>
        <TabsList>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="meta">Meta</TabsTrigger>
          <TabsTrigger value="google">Google</TabsTrigger>
          <TabsTrigger value="tiktok">TikTok</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={
            isSearch ? "Search company…" : "TikTok advertiser / brand name…"
          }
          className="pl-8"
        />
      </div>

      {!isSearch ? (
        <Button
          type="button"
          variant="secondary"
          disabled={!term.trim()}
          onClick={() => {
            const name = term.trim()
            onPick({ platform: "tiktok", externalId: name, name })
            setTerm("")
          }}
        >
          <PlusIcon data-icon="inline-start" />
          Add TikTok channel
        </Button>
      ) : (
        <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
          {debounced.length < 2 && (
            <p className="px-1 py-4 text-center text-sm text-muted-foreground">
              Type at least 2 characters.
            </p>
          )}
          {debounced.length >= 2 && isFetching && (
            <p className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              Searching…
            </p>
          )}
          {debounced.length >= 2 && !isFetching && rows.length === 0 && (
            <p className="px-1 py-4 text-center text-sm text-muted-foreground">
              No results.
            </p>
          )}
          {rows.map((r) => (
            <button
              key={r.externalId}
              type="button"
              onClick={() =>
                onPick({
                  platform,
                  externalId: r.externalId,
                  name: r.name,
                  logo: r.logo,
                  url: r.url,
                })
              }
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted"
            >
              <Avatar className="size-8 rounded-md">
                {r.logo && <AvatarImage src={r.logo} alt="" />}
                <AvatarFallback className="rounded-md text-xs">
                  {r.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{r.name}</span>
                {r.sub && (
                  <span className="truncate text-xs text-muted-foreground">{r.sub}</span>
                )}
              </div>
              <PlusIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
