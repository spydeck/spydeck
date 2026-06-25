"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
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
import {
  formatDateShort,
  formatCompact,
  postTypeLabel,
  toHandle,
} from "@/app/(app)/posts/_components/post-helpers"
import { Star } from "lucide-react"

// TODO(backend): persist rating/tags/notes + post permalink

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
        <SheetHeader className="px-4 pt-4 pb-3 border-b">
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
            <div className="px-4 py-4 flex flex-col gap-5">

              {/* POST section */}
              <div>
                <SectionLabel>Post</SectionLabel>
                {/* Caption */}
                <div className="mb-3">
                  <div className="h-36 overflow-y-auto rounded-md border bg-muted/30 p-3">
                    <p className="text-sm whitespace-pre-wrap">{post.text}</p>
                  </div>
                  <p className="mt-1 text-right text-[11px] text-muted-foreground">
                    {post.text.length} chars
                  </p>
                </div>

                <Row label="Network" value={platformLabel} />
                <Row label="Format" value={postTypeLabel(post.platform)} />
                <Row label="Author" value={handle} />
                <Row label="Name" value={displayName} />
                <Row label="URL" value="—" /> {/* ponytail: permalink not in data model */}
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

              <Separator />

              {/* ANALYSIS section */}
              <div>
                <SectionLabel>Analysis</SectionLabel>

                {/* Rating: non-interactive 5-star display */}
                <div className="flex items-start gap-2 py-1.5">
                  <span className="w-28 shrink-0 text-xs text-muted-foreground">Rating</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-3.5 text-muted-foreground/40" />
                    ))}
                  </div>
                </div>

                <Row label="Tags" value="—" />
                <Row
                  label="Source"
                  value={
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      sync:{post.platform}
                    </Badge>
                  }
                />

                {/* Why it works: placeholder textarea */}
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1.5">Why it works</p>
                  <Textarea
                    disabled
                    placeholder="Analysis notes not yet available."
                    className="resize-none text-xs h-20 bg-muted/30"
                  />
                </div>
              </div>

            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
