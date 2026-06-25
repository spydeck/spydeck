"use client"

import Image from "next/image"
import { Play, Heart, MessageCircle, Forward } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthors } from "@/lib/authors"
import type { Post } from "@/lib/posts"
import {
  formatDateShort,
  formatCompact,
  postTypeLabel,
  toHandle,
} from "./post-helpers"
import { PlatformIcon } from "@/components/platform-icon"

interface PostsCardsProps {
  posts: Post[]
  isPending: boolean
  renderAction?: (post: Post) => React.ReactNode
}

export function PostsCards({ posts, isPending, renderAction }: PostsCardsProps) {
  const { data: authors } = useAuthors()

  const getAuthor = (id: string) => authors?.find((a) => a.id === id)

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-10">No posts found.</p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {posts.map((post) => {
        const author = getAuthor(post.authorId)
        const name = author?.name ?? "Unknown"
        const initials = name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
        const socialValue = author?.socials[post.platform]?.value
        const handle = toHandle(socialValue, name)
        const dateShort = formatDateShort(post.date)
        const typeLabel = postTypeLabel(post.platform)

        const { views, likes, comments, shares } = post.engagement

        return (
          <Card key={post.id} className="overflow-hidden border rounded-xl flex flex-col relative">
            {/* Overlay action (e.g. bookmark) */}
            {renderAction && (
              <div className="absolute top-2 right-2 z-10">
                {renderAction(post)}
              </div>
            )}

            {/* Header strip */}
            <div className="bg-muted/40 border-b px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Avatar className="size-6">
                  <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{handle}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <PlatformIcon platform={post.platform} className="size-4" />
                <span className="text-sm">{typeLabel}</span>
              </div>
            </div>

            {/* Media */}
            {post.mediaUrl ? (
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src={post.mediaUrl}
                  alt=""
                  fill
                  className="object-cover"
                />
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                  {dateShort}
                </span>
              </div>
            ) : (
              <div className="px-3 pt-3 text-right">
                <span className="text-xs text-muted-foreground">{dateShort}</span>
              </div>
            )}

            {/* Body */}
            <div className="px-3 py-3 flex-1">
              <p className={post.mediaUrl ? "line-clamp-2 text-sm" : "line-clamp-6 text-sm"}>
                {post.text}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 px-3 pb-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Play className="size-3" />
                {formatCompact(views ?? 0)}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="size-3" />
                {formatCompact(likes ?? 0)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="size-3" />
                {formatCompact(comments ?? 0)}
              </span>
              <span className="flex items-center gap-1">
                <Forward className="size-3" />
                {formatCompact(shares ?? 0)}
              </span>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
