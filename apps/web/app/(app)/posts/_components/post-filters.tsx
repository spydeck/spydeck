"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PlatformIcon } from "@/components/platform-icon"
import { Fragment } from "react"
import { cn } from "@/lib/utils"
import { useAuthors, type Author } from "@/lib/authors"
import type { Post } from "@/lib/posts"

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
}

// ── Sorting ──────────────────────────────────────────────────────────────────

export type SortKey =
  | "date_desc"
  | "date_asc"
  | "likes_desc"
  | "likes_asc"
  | "comments_desc"
  | "comments_asc"
  | "eng_lc_desc"
  | "eng_vli_desc"

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_desc", label: "Date published (newest)" },
  { value: "date_asc", label: "Date published (oldest)" },
  { value: "likes_desc", label: "Most likes" },
  { value: "likes_asc", label: "Fewest likes" },
  { value: "comments_desc", label: "Most comments" },
  { value: "comments_asc", label: "Fewest comments" },
  { value: "eng_lc_desc", label: "Engagement: likes ÷ comments" },
  { value: "eng_vli_desc", label: "Engagement: views ÷ (likes + comments)" },
]

// ponytail: divide-by-zero returns 0 (sends those posts to the bottom on desc sorts)
function engagementValue(post: Post, key: SortKey): number {
  const { likes = 0, comments = 0, views = 0 } = post.engagement ?? {}
  if (key === "eng_lc_desc") return comments > 0 ? likes / comments : 0
  if (key === "eng_vli_desc") {
    const d = likes + comments
    return d > 0 ? views / d : 0
  }
  return 0
}

// Parse "authorId::platform" | "authorId" | "all"
export function parseAuthorFilter(value: string): {
  authorId?: string
  platform?: string
} {
  if (value === "all") return {}
  const [authorId, platform] = value.split("::")
  return { authorId, platform }
}

// Filter by platform (if any) then sort. Pure — safe to call in a useMemo.
export function applyPostFilters(
  posts: Post[] | undefined,
  sortBy: SortKey,
  platform?: string,
): Post[] {
  let list = [...(posts ?? [])]
  if (platform) list = list.filter((p) => p.platform === platform)
  list.sort((a, b) => {
    switch (sortBy) {
      case "date_desc": return new Date(b.date).getTime() - new Date(a.date).getTime()
      case "date_asc":  return new Date(a.date).getTime() - new Date(b.date).getTime()
      case "likes_desc": return (b.engagement?.likes ?? 0) - (a.engagement?.likes ?? 0)
      case "likes_asc":  return (a.engagement?.likes ?? 0) - (b.engagement?.likes ?? 0)
      case "comments_desc": return (b.engagement?.comments ?? 0) - (a.engagement?.comments ?? 0)
      case "comments_asc":  return (a.engagement?.comments ?? 0) - (b.engagement?.comments ?? 0)
      case "eng_lc_desc":
      case "eng_vli_desc": return engagementValue(b, sortBy) - engagementValue(a, sortBy)
    }
  })
  return list
}

export function SortSelect({
  value,
  onChange,
  className,
}: {
  value: SortKey
  onChange: (value: SortKey) => void
  className?: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
      <SelectTrigger className={cn("w-56", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// ── Author combobox ──────────────────────────────────────────────────────────

function authorAvatar(author: Author): string | undefined {
  return author.profiles.find((p) => p.avatarUrl != null)?.avatarUrl ?? undefined
}

function authorInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

export function AuthorFilter({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const { data: authors } = useAuthors()

  const { authorId, platform } = parseAuthorFilter(value)
  const selectedAuthor = authorId ? authors?.find((a) => a.id === authorId) : undefined
  const triggerLabel =
    value === "all"
      ? "All authors"
      : platform
        ? `${selectedAuthor?.name ?? ""} · ${PLATFORM_LABEL[platform] ?? platform}`
        : (selectedAuthor?.name ?? "All authors")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-72 justify-between", className)}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            {selectedAuthor && (
              <Avatar className="size-5 shrink-0">
                <AvatarImage src={authorAvatar(selectedAuthor)} />
                <AvatarFallback className="text-[9px]">{authorInitials(selectedAuthor.name)}</AvatarFallback>
              </Avatar>
            )}
            <span className="truncate">{triggerLabel}</span>
          </span>
          <ChevronsUpDown data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search author…" />
          <CommandList>
            <CommandEmpty>No author found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all authors"
                onSelect={() => { onChange("all"); setOpen(false) }}
              >
                <Check className={cn("mr-2 size-4", value === "all" ? "opacity-100" : "opacity-0")} />
                All authors
              </CommandItem>
              {authors?.map((author) => (
                <Fragment key={author.id}>
                  <CommandItem
                    value={`${author.name} ${author.profiles.map((p) => p.platform).join(" ")}`}
                    onSelect={() => { onChange(author.id); setOpen(false) }}
                  >
                    <Check className={cn("mr-2 size-4", value === author.id ? "opacity-100" : "opacity-0")} />
                    <Avatar className="size-5 shrink-0 mr-1.5">
                      <AvatarImage src={authorAvatar(author)} />
                      <AvatarFallback className="text-[9px]">{authorInitials(author.name)}</AvatarFallback>
                    </Avatar>
                    {author.name}
                  </CommandItem>
                  {author.profiles.length > 1 && author.profiles.map((profile) => (
                    <CommandItem
                      key={`${author.id}::${profile.platform}`}
                      value={`${author.name} ${profile.platform} ${profile.handle ?? ""}`}
                      onSelect={() => { onChange(`${author.id}::${profile.platform}`); setOpen(false) }}
                      className="pl-8"
                    >
                      <Check className={cn("mr-2 size-4", value === `${author.id}::${profile.platform}` ? "opacity-100" : "opacity-0")} />
                      <PlatformIcon platform={profile.platform} className="size-4 mr-1.5 shrink-0" />
                      <span className="truncate text-muted-foreground">
                        {profile.handle ? `@${profile.handle}` : PLATFORM_LABEL[profile.platform] ?? profile.platform}
                      </span>
                    </CommandItem>
                  ))}
                </Fragment>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
