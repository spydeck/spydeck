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
import { usePosts } from "@/lib/posts"
import { PostsTable } from "./_components/posts-table"
import { PostsCards } from "./_components/posts-cards"
import { SwipeBookmarkButton } from "./_components/swipe-bookmark-button"

export default function PostsPage() {
  const [authorFilter, setAuthorFilter] = useState<string>("all")
  const { data: authors, isPending: authorsLoading } = useAuthors()
  const { data: posts, isPending: postsPending } = usePosts(
    authorFilter === "all" ? undefined : authorFilter
  )

  const noAuthors = !authorsLoading && (!authors || authors.length === 0)

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
