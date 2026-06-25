"use client"

import { useState } from "react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuthors } from "@/lib/authors"
import { useSwipeFiles } from "@/lib/swipe-files"
import type { Post } from "@/lib/posts"
import { PostsTable } from "../posts/_components/posts-table"
import { PostsCards } from "../posts/_components/posts-cards"
import { SwipeBookmarkButton } from "../posts/_components/swipe-bookmark-button"
import { PostDetailSidebar } from "@/components/post-detail-sidebar"

export default function SwipeFilesPage() {
  const [authorFilter, setAuthorFilter] = useState<string>("all")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const { data: authors } = useAuthors()
  const { data: posts, isPending: postsPending } = useSwipeFiles(
    authorFilter === "all" ? undefined : authorFilter
  )

  const isEmpty = !postsPending && (!posts || posts.length === 0)

  return (
    <>
      <PostDetailSidebar post={selectedPost} onClose={() => setSelectedPost(null)} />
      <SiteHeader title="Swipe Files" />
      <div className="flex flex-1 flex-col gap-6 px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Swipe Files</h1>
            <p className="text-sm text-muted-foreground">
              Posts you have saved for inspiration and reference.
            </p>
          </div>
          <Select value={authorFilter} onValueChange={setAuthorFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All authors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All authors</SelectItem>
              {authors?.map((author) => (
                <SelectItem key={author.id} value={author.id}>
                  {author.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isEmpty ? (
          <p className="text-muted-foreground text-sm">
            No saved posts yet.{" "}
            <Link href="/posts" className="underline underline-offset-2">
              Bookmark posts from the Posts page.
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
                posts={posts ?? []}
                isPending={postsPending}
                showAuthor={authorFilter === "all"}
                renderAction={(post) => <SwipeBookmarkButton postId={post.id} />}
                onSelectPost={setSelectedPost}
              />
            </TabsContent>
            <TabsContent value="cards" className="mt-4">
              <PostsCards
                posts={posts ?? []}
                isPending={postsPending}
                renderAction={(post) => <SwipeBookmarkButton postId={post.id} />}
                onSelectPost={setSelectedPost}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  )
}
