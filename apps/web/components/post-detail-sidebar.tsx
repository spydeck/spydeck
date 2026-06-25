"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { PlatformIcon } from "@/components/platform-icon"
import { PLATFORMS, useAuthors } from "@/lib/authors"
import type { Post } from "@/lib/posts"
import { useSwipeFileIds, useToggleSwipeFile } from "@/lib/swipe-files"
import { cn } from "@/lib/utils"
import { Bookmark, Download } from "lucide-react"
import {
  formatDateShort,
  formatCompact,
  postTypeLabel,
  toHandle,
} from "@/app/(app)/posts/_components/post-helpers"

// TODO(backend): persist post permalink

interface PostDetailSidebarProps {
  post: Post | null
  onClose: () => void
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="w-28 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value ?? "—"}</span>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
      {children}
    </p>
  )
}

export function PostDetailSidebar({ post, onClose }: PostDetailSidebarProps) {
  const { data: authors } = useAuthors()
  const { data: savedIds } = useSwipeFileIds()
  const { mutate: toggleSwipe, isPending: swipePending } = useToggleSwipeFile()

  const isSaved = post ? (savedIds?.includes(post.id) ?? false) : false
  // ponytail: download the video if we have it, else the cover image
  const downloadUrl = post?.videoUrl ?? post?.mediaUrl

  const author = post ? authors?.find((a) => a.id === post.authorId) : undefined
  const name = author?.name ?? "Unknown"
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const profile = post
    ? author?.profiles?.find((p) => p.platform === post.platform)
    : undefined

  const socialValue = post ? author?.socials[post.platform]?.value : undefined
  const handle = post ? toHandle(socialValue, name) : ""
  const displayName = profile?.displayName ?? name

  const platformLabel =
    post ? (PLATFORMS.find((p) => p.key === post.platform)?.label ?? post.platform) : ""

  const totalEngagement = post
    ? post.engagement.likes + post.engagement.comments + post.engagement.shares
    : 0

  return (
    <Sheet open={!!post} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-4 pt-4 pb-3 pr-12 border-b">
          <SheetTitle className="sr-only">Post detail</SheetTitle>
          <SheetDescription className="sr-only">
            Detailed view of the selected post.
          </SheetDescription>

          {post && (
            <div className="flex items-start justify-between gap-3">
              {/* Author */}
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="size-9 shrink-0">
                  <AvatarImage src={profile?.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{handle}</p>
                </div>
              </div>
              {/* Platform badge */}
              <Badge variant="outline" className="shrink-0 flex items-center gap-1.5">
                <PlatformIcon platform={post.platform} className="size-3" />
                {platformLabel}
              </Badge>
            </div>
          )}
        </SheetHeader>

        {post && (
          <div className="flex-1 overflow-y-auto">
            {/* Media preview — play the video when available, else show the cover */}
            {(post.videoUrl || post.mediaUrl) && (
              <div className="aspect-[4/3] w-full bg-muted">
                {post.videoUrl ? (
                  <video
                    src={post.videoUrl}
                    poster={post.mediaUrl ?? undefined}
                    controls
                    playsInline
                    className="h-full w-full object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.mediaUrl}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                )}
              </div>
            )}

            <div className="px-4 py-4 flex flex-col gap-5">

              {/* POST section */}
              <div>
                <SectionLabel>Post</SectionLabel>
                {/* Caption */}
                <div className="mb-3">
                  <div className="max-h-60 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap break-words">{post.text}</p>
                  </div>
                  <p className="mt-1 text-right text-[11px] text-muted-foreground">
                    {post.text.length} chars
                  </p>
                </div>

                <Row label="Network" value={platformLabel} />
                <Row label="Format" value={postTypeLabel(post.platform)} />
                <Row label="Author" value={handle} />
                <Row label="Name" value={displayName} />
                <Row
                  label="URL"
                  value={
                    post.postUrl ? (
                      <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 break-all"
                      >
                        {post.postUrl}
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
              </div>

              <Separator />

              {/* METRICS section */}
              <div>
                <SectionLabel>Metrics</SectionLabel>
                <Row label="Reactions" value={formatCompact(post.engagement.likes)} />
                <Row label="Comments" value={formatCompact(post.engagement.comments)} />
                <Row label="Shares" value={formatCompact(post.engagement.shares)} />
                <Row label="Saves" value="—" /> {/* ponytail: not in data model */}
                <Row label="Plays" value={formatCompact(post.engagement.views ?? 0)} />
                <Row label="Total engagement" value={formatCompact(totalEngagement)} />
                <Row label="Engagement %" value="—" /> {/* ponytail: follower count not synced */}
                <Row label="Published" value={formatDateShort(post.date)} />
              </div>

            </div>
          </div>
        )}

        {post && (
          <div className="grid grid-cols-2 gap-2 border-t px-4 py-3">
            <Button
              variant="outline"
              disabled={!downloadUrl}
              asChild={!!downloadUrl}
            >
              {downloadUrl ? (
                <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="size-4" />
                  Download Post
                </a>
              ) : (
                <span>
                  <Download className="size-4" />
                  Download Post
                </span>
              )}
            </Button>
            <Button
              variant={isSaved ? "secondary" : "default"}
              disabled={swipePending}
              onClick={() => toggleSwipe({ postId: post.id, saved: isSaved })}
            >
              <Bookmark className={cn("size-4", isSaved && "fill-current")} />
              {isSaved ? "Saved" : "Add to Swipe"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
