"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Building2Icon,
  ChevronsUpDownIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
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
import type { Advertiser, AdvertisersResponse } from "./google-ad"

export function GoogleAdvertiserSelect({
  label,
  region,
  onChange,
  className,
}: {
  label: string
  region: string
  onChange: (advertiser: Advertiser | null) => void
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [term, setTerm] = React.useState("")
  const [debounced, setDebounced] = React.useState("")

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 350)
    return () => clearTimeout(t)
  }, [term])

  const { data, isFetching } = useQuery({
    queryKey: ["google-advertisers", debounced, region],
    queryFn: () =>
      apiFetch<AdvertisersResponse>(
        `/ads/google/advertisers?query=${encodeURIComponent(debounced)}${region ? `&region=${region}` : ""}`
      ),
    enabled: open && debounced.length >= 2,
    staleTime: 5 * 60 * 1000,
  })
  const advertisers = data?.advertisers ?? []

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
          <span className="flex min-w-0 items-center gap-2">
            <Building2Icon className="size-4 shrink-0 text-muted-foreground" />
            <span className={cn("truncate", !label && "text-muted-foreground")}>
              {label || "Search company"}
            </span>
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={term}
            onValueChange={setTerm}
            placeholder="Search advertiser…"
          />
          <CommandList>
            {label && (
              <CommandItem
                value="__clear"
                onSelect={() => {
                  onChange(null)
                  setOpen(false)
                }}
              >
                <XIcon className="size-4 text-muted-foreground" />
                Clear selection
              </CommandItem>
            )}

            {debounced.length < 2 && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search.
              </div>
            )}
            {debounced.length >= 2 && isFetching && (
              <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                Searching…
              </div>
            )}
            {debounced.length >= 2 && !isFetching && advertisers.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No advertisers found.
              </div>
            )}
            {advertisers.length > 0 && (
              <CommandGroup>
                {advertisers.map((a) => (
                  <CommandItem
                    key={a.advertiser_id}
                    value={a.advertiser_id}
                    onSelect={() => {
                      onChange(a)
                      setOpen(false)
                    }}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm">{a.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {a.region} · ~
                        {a.number_of_ads_estimate?.toLocaleString?.() ??
                          a.number_of_ads_estimate}{" "}
                        ads
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
