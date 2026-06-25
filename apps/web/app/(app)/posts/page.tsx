"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { RefreshCw, Bookmark, X } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { SiteHeader } from "@/components/site-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useAuthors, useSyncPosts, SYNC_REFRESH_DELAY_MS } from "@/lib/authors"
import { usePosts, type Post } from "@/lib/posts"
import { useSwipeFileIds, useAddSwipeFiles } from "@/lib/swipe-files"
import { PostsTable } from "./_components/posts-table"
import { PostsCards } from "./_components/posts-cards"
import { SwipeBookmarkButton } from "./_components/swipe-bookmark-button"
import { PostDetailSidebar } from "@/components/post-detail-sidebar"
import {
  AuthorFilter,
  SortSelect,
  applyPostFilters,
  parseAuthorFilter,
  type SortKey,
} from "./_components/post-filters"
import { cn } from "@/lib/utils"

export default function PostsPage() {
  const [authorFilter, setAuthorFilter] = useState<string>("all")
  const [syncing, setSyncing] = useState(false)
  const [sortBy, setSortBy] = useState<SortKey>("date_desc")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { authorId: selectedAuthorId, platform: selectedPlatform } =
    parseAuthorFilter(authorFilter)

  const { data: authors, isPending: authorsLoading } = useAuthors()
  const { data: posts, isPending: postsPending } = usePosts(selectedAuthorId)
  const { data: savedIds } = useSwipeFileIds()
  const addSwipeFiles = useAddSwipeFiles()
  const syncPosts = useSyncPosts()
  const queryClient = useQueryClient()

  function toggleSelect(postId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }

  function toggleSelectAll(postIds: string[], checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of postIds) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  function handleAddSelectedToSwipe() {
    // Skip posts already in swipe files to avoid the unique-constraint error.
    const toAdd = [...selectedIds].filter((id) => !(savedIds ?? []).includes(id))
    if (toAdd.length === 0) {
      toast.info("Selected posts are already in your swipe files")
      setSelectedIds(new Set())
      return
    }
    addSwipeFiles.mutate(toAdd, {
      onSuccess: () => {
        toast.success(`Added ${toAdd.length} post${toAdd.length > 1 ? "s" : ""} to swipe files`)
        setSelectedIds(new Set())
      },
      onError: () => toast.error("Failed to add posts to swipe files"),
    })
  }

  const sortedPosts = useMemo(
    () => applyPostFilters(posts, sortBy, selectedPlatform),
    [posts, sortBy, selectedPlatform],
  )

  const noAuthors = !authorsLoading && (!authors || authors.length === 0)

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
            <SortSelect value={sortBy} onChange={setSortBy} />
            <AuthorFilter value={authorFilter} onChange={setAuthorFilter} />
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
                onSelectPost={setSelectedPost}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onSelectAll={toggleSelectAll}
                renderAction={(post) => <SwipeBookmarkButton postId={post.id} />}
              />
            </TabsContent>
            <TabsContent value="cards" className="mt-4">
              <PostsCards
                posts={sortedPosts}
                isPending={postsPending}
                onSelectPost={setSelectedPost}
                renderAction={(post) => <SwipeBookmarkButton postId={post.id} />}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <div className="flex items-center gap-3 rounded-full border bg-background/95 py-2 pl-4 pr-2 shadow-lg backdrop-blur">
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear selection"
              className="size-8"
              onClick={() => setSelectedIds(new Set())}
            >
              <X />
            </Button>
            <Button
              size="sm"
              disabled={addSwipeFiles.isPending}
              onClick={handleAddSelectedToSwipe}
            >
              <Bookmark data-icon="inline-start" />
              Add to Swipe
            </Button>
          </div>
        </div>
      )}

      <PostDetailSidebar post={selectedPost} onClose={() => setSelectedPost(null)} />
    </>
  )
}
