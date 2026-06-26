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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

interface CompanySuggestion {
  name: string
  companyId: string
  url: string | null
  logo: string | null
  industry: string | null
  location: string | null
}

export function CompanySearch({
  company,
  companyId,
  onChange,
  className,
}: {
  company: string
  companyId: string
  onChange: (next: { company: string; companyId: string }) => void
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
    queryKey: ["linkedin-companies", debounced],
    queryFn: () =>
      apiFetch<{ companies: CompanySuggestion[] }>(
        `/ads/linkedin/companies?query=${encodeURIComponent(debounced)}`
      ),
    enabled: open && debounced.length >= 2,
    staleTime: 5 * 60 * 1000,
  })
  const companies = data?.companies ?? []

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
            <span className={cn("truncate", !company && "text-muted-foreground")}>
              {company || "Search company"}
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
            placeholder="Search LinkedIn companies…"
          />
          <CommandList>
            {(company || companyId) && (
              <CommandItem
                value="__clear"
                onSelect={() => {
                  onChange({ company: "", companyId: "" })
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

            {debounced.length >= 2 && !isFetching && companies.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No companies found.
              </div>
            )}

            {companies.length > 0 && (
              <CommandGroup>
                {companies.map((c) => (
                  <CommandItem
                    key={c.companyId}
                    value={c.companyId}
                    onSelect={() => {
                      onChange({ company: c.name, companyId: c.companyId })
                      setOpen(false)
                    }}
                    className="gap-2"
                  >
                    <Avatar className="size-6 rounded">
                      {c.logo && <AvatarImage src={c.logo} alt="" />}
                      <AvatarFallback className="rounded text-[10px]">
                        {c.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm">{c.name}</span>
                      {(c.industry || c.location) && (
                        <span className="truncate text-xs text-muted-foreground">
                          {[c.industry, c.location].filter(Boolean).join(" · ")}
                        </span>
                      )}
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
