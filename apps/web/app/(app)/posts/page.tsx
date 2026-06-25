"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, ChevronsUpDown, RefreshCw } from "lucide-react"
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
import { useAuthors, useSyncPosts, SYNC_REFRESH_DELAY_MS } from "@/lib/authors"
import { usePosts } from "@/lib/posts"
import { PostsTable } from "./_components/posts-table"
import { PostsCards } from "./_components/posts-cards"
import { SwipeBookmarkButton } from "./_components/swipe-bookmark-button"
import { cn } from "@/lib/utils"

export default function PostsPage() {
  const [authorFilter, setAuthorFilter] = useState<string>("all")
  const [open, setOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const { data: authors, isPending: authorsLoading } = useAuthors()
  const { data: posts, isPending: postsPending } = usePosts(
    authorFilter === "all" ? undefined : authorFilter
  )
  const syncPosts = useSyncPosts()
  const queryClient = useQueryClient()

  const noAuthors = !authorsLoading && (!authors || authors.length === 0)
  const selectedAuthorName =
    authorFilter === "all"
      ? "All authors"
      : (authors?.find((a) => a.id === authorFilter)?.name ?? "All authors")

  function handleSync() {
    if (authorFilter === "all") return
    syncPosts.mutate(authorFilter, {
      onSuccess: () => {
        toast.info("Syncing posts…")
        setSyncing(true)
        // ponytail: timed affordance — sync is async/queued, no completion signal here
        setTimeout(() => {
          setSyncing(false)
          queryClient.invalidateQueries({ queryKey: ["posts", authorFilter] })
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
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-48 justify-between"
                >
                  <span className="truncate">{selectedAuthorName}</span>
                  <ChevronsUpDown data-icon="inline-end" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-0">
                <Command>
                  <CommandInput placeholder="Search author…" />
                  <CommandList>
                    <CommandEmpty>No author found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setAuthorFilter("all")
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 size-4",
                            authorFilter === "all" ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All authors
                      </CommandItem>
                      {authors?.map((author) => (
                        <CommandItem
                          key={author.id}
                          value={author.name}
                          onSelect={() => {
                            setAuthorFilter(author.id)
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              authorFilter === author.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {author.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              disabled={authorFilter === "all" || syncing || syncPosts.isPending}
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
          <Tabs defaultValue="table">
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
            </TabsList>
            <TabsContent value="table" className="mt-4">
              <PostsTable
                posts={posts ?? []}
                isPending={postsPending}
                showAuthor={authorFilter === "all"}
                renderAction={(post) => <SwipeBookmarkButton postId={post.id} />}
              />
            </TabsContent>
            <TabsContent value="cards" className="mt-4">
              <PostsCards
                posts={posts ?? []}
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
