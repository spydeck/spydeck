"use client"

import { BookmarkIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSavedAds } from "../../swipe-ads/_components/use-saved-ads"
import { toAdResult, type NormalizedAd } from "./normalized-ad"

export function SaveAdButton({ ad }: { ad: NormalizedAd }) {
  const { savedIds, toggleAd } = useSavedAds()
  const isSaved = savedIds.has(ad.id)
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isSaved ? "Remove from Swipe Ads" : "Save to Swipe Ads"}
      onClick={() => toggleAd(toAdResult(ad))}
      className="size-8 shrink-0 rounded-full border border-red-500/40"
    >
      <BookmarkIcon className={cn("size-4 text-red-500", isSaved && "fill-current")} />
    </Button>
  )
}
