"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { NormalizedAd } from "../../search-ads/_components/normalized-ad"

interface AdvertiserOption {
  advertiser: string
  logo: string | null
  platform: NormalizedAd["platform"]
}

// Distinct advertisers (first logo/platform seen wins) for the filter list.
export function advertiserOptions(ads: NormalizedAd[]): AdvertiserOption[] {
  const map = new Map<string, AdvertiserOption>()
  for (const ad of ads) {
    if (!map.has(ad.advertiser)) {
      map.set(ad.advertiser, {
        advertiser: ad.advertiser,
        logo: ad.advertiserLogo ?? null,
        platform: ad.platform,
      })
    }
  }
  return [...map.values()].sort((a, b) =>
    a.advertiser.localeCompare(b.advertiser)
  )
}

export function AdvertiserFilter({
  value,
  onChange,
  options,
  className,
}: {
  value: string
  onChange: (value: string) => void
  options: AdvertiserOption[]
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const selected = options.find((o) => o.advertiser === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between font-normal", className)}
        >
          <span className="truncate">
            {value === "all" ? "All advertisers" : selected?.advertiser ?? value}
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search advertiser…" />
          <CommandList>
            <CommandEmpty>No advertisers found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all advertisers"
                onSelect={() => {
                  onChange("all")
                  setOpen(false)
                }}
              >
                <CheckIcon
                  className={cn(
                    "size-4",
                    value === "all" ? "opacity-100" : "opacity-0"
                  )}
                />
                All advertisers
              </CommandItem>
              {options.map((o) => (
                <CommandItem
                  key={o.advertiser}
                  value={o.advertiser}
                  onSelect={() => {
                    onChange(o.advertiser)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "size-4",
                      value === o.advertiser ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Avatar className="size-6 rounded">
                    {o.logo && <AvatarImage src={o.logo} alt="" />}
                    <AvatarFallback className="rounded text-[10px]">
                      {o.advertiser.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{o.advertiser}</span>
                  <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">
                    {o.platform}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
