"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, TagIcon } from "lucide-react"
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
import type { SwipeCategory } from "./use-categories"

// value: "all" (any) | "none" (uncategorized) | a category id
export function CategoryFilter({
  value,
  onChange,
  categories,
  className,
}: {
  value: string
  onChange: (value: string) => void
  categories: SwipeCategory[]
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const selected = categories.find((c) => c.id === value)

  const label =
    value === "all"
      ? "All categories"
      : value === "none"
        ? "Uncategorized"
        : selected?.name ?? "Category"

  function pick(next: string) {
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
          className={cn("justify-between font-normal", className)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <TagIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{label}</span>
          </span>
          <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search category…" />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="all categories" onSelect={() => pick("all")}>
                <CheckIcon
                  className={cn("size-4", value === "all" ? "opacity-100" : "opacity-0")}
                />
                All categories
              </CommandItem>
              <CommandItem value="uncategorized" onSelect={() => pick("none")}>
                <CheckIcon
                  className={cn("size-4", value === "none" ? "opacity-100" : "opacity-0")}
                />
                Uncategorized
              </CommandItem>
              {categories.map((c) => (
                <CommandItem key={c.id} value={c.name} onSelect={() => pick(c.id)}>
                  <CheckIcon
                    className={cn(
                      "size-4",
                      value === c.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span
                    className="size-3 shrink-0 rounded-full border"
                    style={c.color ? { backgroundColor: c.color } : undefined}
                  />
                  <span className="truncate">{c.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
