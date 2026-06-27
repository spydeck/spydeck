"use client"

import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useAdvertisers,
  useCreateAdvertiser,
  type AdvertiserPlatform,
} from "@/lib/advertisers"
import type { NormalizedAd } from "./normalized-ad"

// Explicit map — .toLowerCase() would silently mis-map "YouTube" (not a DB platform).
// ponytail: YouTube has no AdvertiserPlatform equivalent; channel entry is skipped.
const PLATFORM_MAP: Partial<Record<NonNullable<NormalizedAd["platform"]>, AdvertiserPlatform>> = {
  Meta: "meta",
  TikTok: "tiktok",
  Google: "google",
  LinkedIn: "linkedin",
}

export function AdvertiserLogoMenu({ ad }: { ad: NormalizedAd }) {
  const { data: advertisers } = useAdvertisers()
  const { mutate, isPending } = useCreateAdvertiser()

  const alreadyExists = advertisers?.some(
    (a) => a.name.toLowerCase() === ad.advertiser.toLowerCase()
  ) ?? false

  function handleAdd() {
    const dbPlatform = PLATFORM_MAP[ad.platform]
    mutate(
      {
        name: ad.advertiser,
        logo: ad.advertiserLogo ?? null,
        channels: dbPlatform
          ? [
              {
                platform: dbPlatform,
                // ponytail: NormalizedAd carries no true advertiser/page id; ad.id (the ad id) is best available
                externalId: ad.id,
                name: ad.advertiser,
                url: ad.destinationUrl ?? null,
                logo: ad.advertiserLogo ?? null,
              },
            ]
          : [],
      },
      {
        onSuccess: () => toast.success("Added to advertisers"),
        onError: () => toast.error("Failed to add advertiser"),
      }
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar
          className="size-8 cursor-pointer rounded-md ring-offset-background transition-shadow hover:ring-2 hover:ring-ring hover:ring-offset-1"
          aria-label={`Advertiser actions for ${ad.advertiser}`}
        >
          {ad.advertiserLogo && (
            <AvatarImage src={ad.advertiserLogo} alt={ad.advertiser} />
          )}
          <AvatarFallback className="rounded-md bg-muted text-xs font-semibold">
            {ad.advertiser.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {alreadyExists ? (
          <DropdownMenuLabel className="font-normal text-muted-foreground">
            Already in advertisers
          </DropdownMenuLabel>
        ) : (
          <DropdownMenuItem onClick={handleAdd} disabled={isPending}>
            Add to advertisers
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
