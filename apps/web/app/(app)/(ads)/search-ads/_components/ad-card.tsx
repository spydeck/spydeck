"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { SaveAdButton } from "./save-ad-button"
import type { NormalizedAd } from "./normalized-ad"

export function AdCard({ ad }: { ad: NormalizedAd }) {
  const [expanded, setExpanded] = useState(false)
  // ponytail: char-count heuristic for "long enough to clamp"; swap for a measured ref if it misfires
  const isLong = (ad.description?.length ?? 0) > 180

  return (
    <Card className="mb-4 flex break-inside-avoid flex-col gap-0 overflow-hidden rounded-xl py-0">
      {/* Author header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Avatar className="size-8 rounded-md">
          <AvatarFallback className="rounded-md bg-muted text-xs font-semibold">
            {ad.advertiser.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight text-foreground">
            {ad.advertiser}
          </p>
          {ad.subtitle && (
            <p className="truncate text-xs text-muted-foreground">{ad.subtitle}</p>
          )}
        </div>
        <SaveAdButton ad={ad} />
      </div>

      {/* Body copy */}
      {ad.description && (
        <div className="px-4 pb-3">
          <p
            className={cn(
              "text-sm leading-snug text-foreground",
              expanded ? "whitespace-pre-line" : "line-clamp-4"
            )}
          >
            {ad.description}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-sm font-medium text-muted-foreground hover:underline"
            >
              {expanded ? "Show less" : "Expand text"}
            </button>
          )}
        </div>
      )}

      {/* Creative — natural height for the masonry layout */}
      {ad.videoUrl ? (
        <video
          src={ad.videoUrl}
          poster={ad.imageUrl ?? undefined}
          controls
          preload="metadata"
          className="max-h-120 w-full bg-muted object-cover"
        />
      ) : ad.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.imageUrl}
          alt={ad.headline ?? ad.advertiser}
          className="max-h-120 w-full bg-muted object-cover"
        />
      ) : null}

      {/* Headline + view details */}
      {(ad.headline || ad.destinationUrl) && (
        <div className="flex flex-col gap-2 px-4 py-3">
          {ad.headline && (
            <p className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
              {ad.headline}
            </p>
          )}
          {ad.destinationUrl && (
            <a
              href={ad.destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              {ad.cta || "View details"}
            </a>
          )}
        </div>
      )}

      {/* Stats footer */}
      {ad.stats && ad.stats.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2 text-xs text-muted-foreground">
          {ad.stats.map((stat) => (
            <span key={stat.label} className="flex items-center gap-1">
              <span>{stat.label}</span>
              <span className="font-medium text-foreground">{stat.value}</span>
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}
