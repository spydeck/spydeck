"use client"

import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon, RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { GoogleAdDetail } from "../google/_components/google-ad-detail"
import { LinkedInAdDetail } from "../linkedin/_components/linkedin-ad-detail"
import { MetaAdDetail } from "../meta/_components/meta-ad-detail"
import { TikTokAdDetail } from "../tiktok/_components/tiktok-ad-detail"
import { toAdDetailRequest, type NormalizedAd } from "./normalized-ad"

interface AdDetailRow {
  platform: string
  externalId: string
  sourceUrl: string | null
  detail: unknown
  fetchedAt: string
}

// One detail layout per network — each ad-library returns a different shape.
function PlatformDetailBody({
  platform,
  detail,
}: {
  platform: NormalizedAd["platform"]
  detail: unknown
}) {
  switch (platform) {
    case "LinkedIn":
      return <LinkedInAdDetail detail={detail} />
    case "Meta":
      return <MetaAdDetail detail={detail} />
    case "TikTok":
      return <TikTokAdDetail detail={detail} />
    case "Google":
      return <GoogleAdDetail detail={detail} />
    default:
      return null
  }
}

export function AdDetailSidebar({
  ad,
  onClose,
}: {
  ad: NormalizedAd | null
  onClose: () => void
}) {
  const req = ad ? toAdDetailRequest(ad) : null
  const [syncing, setSyncing] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ad-detail", req?.platform, req?.externalId],
    queryFn: () =>
      apiFetch<AdDetailRow>(`/sync/ad-details/${req!.platform}/${req!.externalId}`),
    enabled: !!req,
    retry: false,
    // While syncing, poll until the queued job persists the detail.
    refetchInterval: syncing ? 2000 : false,
  })

  // Stop the spinner once the detail lands; refresh the table's persisted markers.
  useEffect(() => {
    if (data && syncing) {
      setSyncing(false)
      queryClient.invalidateQueries({ queryKey: ["ad-persisted"] })
    }
  }, [data, syncing, queryClient])

  // Safety: don't spin forever if the job never completes.
  useEffect(() => {
    if (!syncing) return
    const t = setTimeout(() => {
      setSyncing(false)
      toast.error("Sync is taking longer than expected. Try again.")
    }, 60000)
    return () => clearTimeout(t)
  }, [syncing])

  // Reset the spinner when switching ads.
  useEffect(() => {
    setSyncing(false)
  }, [req?.externalId])

  async function handleSync() {
    if (!req) return
    setSyncing(true)
    try {
      await apiFetch("/sync/ad-detail", {
        method: "POST",
        body: JSON.stringify(req),
      })
      refetch()
    } catch {
      setSyncing(false)
      toast.error("Failed to start sync")
    }
  }

  return (
    <Sheet
      open={!!ad}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="truncate">
            {ad?.headline || ad?.advertiser || "Ad detail"}
          </SheetTitle>
          <SheetDescription>
            {[ad?.advertiser, ad?.platform].filter(Boolean).join(" · ")}
            {data ? ` · fetched ${new Date(data.fetchedAt).toLocaleString()}` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          {isLoading && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {isError && !data && (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                {syncing
                  ? "Synchronizing this ad's details…"
                  : "This ad isn't synchronized yet."}
              </p>
              <Button onClick={handleSync} disabled={syncing || !req}>
                {syncing ? (
                  <>
                    <Loader2Icon data-icon="inline-start" className="animate-spin" />
                    Synchronizing…
                  </>
                ) : (
                  <>
                    <RefreshCwIcon data-icon="inline-start" />
                    Sync details
                  </>
                )}
              </Button>
            </div>
          )}

          {data && ad && (
            <>
              {data.sourceUrl && (
                <a
                  href={data.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open original ad
                </a>
              )}
              <PlatformDetailBody platform={ad.platform} detail={data.detail} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
