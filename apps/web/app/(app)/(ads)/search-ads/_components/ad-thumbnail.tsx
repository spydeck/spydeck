"use client"

import { PlayIcon, ImageIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { NormalizedAd } from "./normalized-ad"

export function AdThumbnail({ ad }: { ad: NormalizedAd }) {
  const title = ad.headline || ad.advertiser

  if (!ad.videoUrl && !ad.imageUrl) {
    return (
      <div className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ImageIcon className="size-4" />
      </div>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="View ad media"
          className="relative block size-12 overflow-hidden rounded-md bg-muted ring-offset-background transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {ad.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <PlayIcon className="size-4" />
            </span>
          )}
          {ad.videoUrl && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
              <PlayIcon className="size-4 fill-current" />
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate">{title}</DialogTitle>
        </DialogHeader>
        {ad.videoUrl ? (
          <video
            src={ad.videoUrl}
            poster={ad.imageUrl ?? undefined}
            controls
            autoPlay
            className="max-h-[70vh] w-full rounded-md bg-muted"
          />
        ) : ad.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.imageUrl}
            alt={title}
            className="max-h-[70vh] w-full rounded-md bg-muted object-contain"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
