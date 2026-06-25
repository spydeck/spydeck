"use client"

import * as React from "react"
import { ChevronsUpDownIcon, GlobeIcon, XIcon } from "lucide-react"
import { CircleFlag } from "react-circle-flags"
import { countries as countriesData } from "country-data-list"

import { cn } from "@/lib/utils"
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

interface Country {
  name: string
  alpha2: string
  alpha3: string
  status: string
}

const COUNTRY_LIST: Country[] = (countriesData.all as Country[])
  .filter((c) => c.status === "assigned" && c.alpha2)
  .sort((a, b) => a.name.localeCompare(b.name))

const COUNTRY_LOOKUP = new Map<string, Country>(
  COUNTRY_LIST.map((c) => [c.alpha2.toUpperCase(), c])
)

interface CountrySelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  allowEmpty?: boolean
  className?: string
  disabled?: boolean
}

export function CountrySelect({
  value,
  onChange,
  placeholder = "Country",
  allowEmpty = true,
  className,
  disabled,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false)

  const selected = value ? COUNTRY_LOOKUP.get(value.toUpperCase()) : undefined

  function handleSelect(next: string) {
    onChange(next)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("justify-between font-normal", className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected ? (
              <>
                <CircleFlag
                  countryCode={selected.alpha2.toLowerCase()}
                  className="size-4 shrink-0"
                />
                <span className="truncate">{selected.name}</span>
              </>
            ) : (
              <>
                <GlobeIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-muted-foreground">{placeholder}</span>
              </>
            )}
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command
          filter={(itemValue, search) => {
            const term = search.trim().toLowerCase()
            if (!term) return 1
            return itemValue.toLowerCase().includes(term) ? 1 : 0
          }}
        >
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {allowEmpty && (
                <CommandItem
                  value="all countries"
                  data-checked={value === ""}
                  onSelect={() => handleSelect("")}
                >
                  <XIcon className="size-4 text-muted-foreground" />
                  <span>All countries</span>
                </CommandItem>
              )}
              {COUNTRY_LIST.map((country) => {
                const code = country.alpha2.toUpperCase()
                return (
                  <CommandItem
                    key={code}
                    value={`${country.name} ${code} ${country.alpha3}`}
                    data-checked={value.toUpperCase() === code}
                    onSelect={() => handleSelect(code)}
                  >
                    <CircleFlag
                      countryCode={country.alpha2.toLowerCase()}
                      className="size-4 shrink-0"
                    />
                    <span className="truncate">{country.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{code}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
