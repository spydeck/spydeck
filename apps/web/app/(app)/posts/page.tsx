"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Check, ChevronsUpDown, RefreshCw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { SiteHeader } from "@/components/site-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useAuthors, useSyncPosts, SYNC_REFRESH_DELAY_MS, type Author } from "@/lib/authors"
import { usePosts, type Post } from "@/lib/posts"
import { PostsTable } from "./_components/posts-table"
import { PostsCards } from "./_components/posts-cards"
import { SwipeBookmarkButton } from "./_components/swipe-bookmark-button"
import { PlatformIcon } from "@/components/platform-icon"
import { cn } from "@/lib/utils"

function authorAvatar(author: Author): string | undefined {
  return author.profiles.find((p) => p.avatarUrl != null)?.avatarUrl ?? undefined
}

function authorInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

type SortKey =
  | "date_desc"
  | "date_asc"
  | "likes_desc"
  | "likes_asc"
  | "comments_desc"
  | "comments_asc"
  | "eng_lc_desc"
  | "eng_vli_desc"

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date_desc", label: "Date published (newest)" },
  { value: "date_asc", label: "Date published (oldest)" },
  { value: "likes_desc", label: "Most likes" },
  { value: "likes_asc", label: "Fewest likes" },
  { value: "comments_desc", label: "Most comments" },
  { value: "comments_asc", label: "Fewest comments" },
  { value: "eng_lc_desc", label: "Engagement: likes ÷ comments" },
  { value: "eng_vli_desc", label: "Engagement: views ÷ (likes + comments)" },
]

// ponytail: returns a numeric sort key; divide-by-zero returns 0 (sends those posts to the bottom on desc sorts)
function engagementValue(post: Post, key: SortKey): number {
  const { likes = 0, comments = 0, views = 0 } = post.engagement ?? {}
  if (key === "eng_lc_desc") return comments > 0 ? likes / comments : 0
  if (key === "eng_vli_desc") { const d = likes + comments; return d > 0 ? views / d : 0 }
  return 0
}

export default function PostsPage() {
  const [authorFilter, setAuthorFilter] = useState<string>("all")
  const [open, setOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>("date_desc")

  // Parse "authorId::platform" or "authorId" or "all"
  const selectedAuthorId = authorFilter === "all" ? undefined : authorFilter.split("::")[0]
  const selectedPlatform = authorFilter.includes("::") ? authorFilter.split("::")[1] : undefined

  const { data: authors, isPending: authorsLoading } = useAuthors()
  const { data: posts, isPending: postsPending } = usePosts(selectedAuthorId)
  const syncPosts = useSyncPosts()
  const queryClient = useQueryClient()

  const sortedPosts = useMemo(() => {
    let list = [...(posts ?? [])]
    if (selectedPlatform) {
      list = list.filter((p) => p.platform === selectedPlatform)
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "date_desc": return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "date_asc":  return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "likes_desc": return (b.engagement?.likes ?? 0) - (a.engagement?.likes ?? 0)
        case "likes_asc":  return (a.engagement?.likes ?? 0) - (b.engagement?.likes ?? 0)
        case "comments_desc": return (b.engagement?.comments ?? 0) - (a.engagement?.comments ?? 0)
        case "comments_asc":  return (a.engagement?.comments ?? 0) - (b.engagement?.comments ?? 0)
        case "eng_lc_desc":  return engagementValue(b, sortBy) - engagementValue(a, sortBy)
        case "eng_vli_desc": return engagementValue(b, sortBy) - engagementValue(a, sortBy)
      }
    })
    return list
  }, [posts, sortBy, selectedPlatform])

  const noAuthors = !authorsLoading && (!authors || authors.length === 0)
  const selectedAuthor = selectedAuthorId ? authors?.find((a) => a.id === selectedAuthorId) : undefined
  const PLATFORM_LABEL: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", x: "X" }
  const triggerLabel = authorFilter === "all"
    ? "All authors"
    : selectedPlatform
      ? `${selectedAuthor?.name ?? ""} · ${PLATFORM_LABEL[selectedPlatform] ?? selectedPlatform}`
      : (selectedAuthor?.name ?? "All authors")

  function handleSync() {
    if (!selectedAuthorId) return
    syncPosts.mutate(selectedAuthorId, {
      onSuccess: () => {
        toast.info("Syncing posts…")
        setSyncing(true)
        // ponytail: timed affordance — sync is async/queued, no completion signal here
        setTimeout(() => {
          setSyncing(false)
          queryClient.invalidateQueries({ queryKey: ["posts", selectedAuthorId] })
        }, SYNC_REFRESH_DELAY_MS)
      },
      onError: () => toast.error("Failed to start sync"),
    })
  }

  return (
    <>
      <SiteHeader title="Posts" />
      <div className="flex flex-1 flex-col gap-6 px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Posts</h1>
            <p className="text-sm text-muted-foreground">
              View posts across all your authors and social platforms.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger className="w-56">
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
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-52 justify-between"
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
              <PopoverContent className="w-52 p-0">
                <Command>
                  <CommandInput placeholder="Search author…" />
                  <CommandList>
                    <CommandEmpty>No author found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all authors"
                        onSelect={() => { setAuthorFilter("all"); setOpen(false) }}
                      >
                        <Check className={cn("mr-2 size-4", authorFilter === "all" ? "opacity-100" : "opacity-0")} />
                        All authors
                      </CommandItem>
                      {authors?.map((author) => (
                        <>
                          <CommandItem
                            key={author.id}
                            value={`${author.name} ${author.profiles.map((p) => p.platform).join(" ")}`}
                            onSelect={() => { setAuthorFilter(author.id); setOpen(false) }}
                          >
                            <Check className={cn("mr-2 size-4", authorFilter === author.id ? "opacity-100" : "opacity-0")} />
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
                              onSelect={() => { setAuthorFilter(`${author.id}::${profile.platform}`); setOpen(false) }}
                              className="pl-8"
                            >
                              <Check className={cn("mr-2 size-4", authorFilter === `${author.id}::${profile.platform}` ? "opacity-100" : "opacity-0")} />
                              <PlatformIcon platform={profile.platform} className="size-4 mr-1.5 shrink-0" />
                              <span className="truncate text-muted-foreground">
                                {profile.handle ? `@${profile.handle}` : PLATFORM_LABEL[profile.platform] ?? profile.platform}
                              </span>
                            </CommandItem>
                          ))}
                        </>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              disabled={!selectedAuthorId || syncing || syncPosts.isPending}
              onClick={handleSync}
            >
              <RefreshCw
                data-icon="inline-start"
                className={cn(syncing || syncPosts.isPending ? "animate-spin" : "")}
              />
              Sync
            </Button>
          </div>
        </div>

        {noAuthors ? (
          <p className="text-muted-foreground text-sm">
            No posts yet.{" "}
            <Link href="/authors" className="underline underline-offset-2">
              Add an author first.
            </Link>
          </p>
        ) : (
          <Tabs defaultValue="cards">
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
            </TabsList>
            <TabsContent value="table" className="mt-4">
              <PostsTable
                posts={sortedPosts}
                isPending={postsPending}
                showAuthor={!selectedAuthorId}
                renderAction={(post) => <SwipeBookmarkButton postId={post.id} />}
              />
            </TabsContent>
            <TabsContent value="cards" className="mt-4">
              <PostsCards
                posts={sortedPosts}
                isPending={postsPending}
                renderAction={(post) => <SwipeBookmarkButton postId={post.id} />}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  )
}
