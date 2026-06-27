"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthors, PLATFORMS, type AuthorProfile } from "@/lib/authors"
import { usePosts, type Post } from "@/lib/posts"
import { PlatformIcon } from "@/components/platform-icon"
import { PostsCards } from "@/app/(app)/posts/_components/posts-cards"
import { PostDetailSidebar } from "@/components/post-detail-sidebar"

const fmt = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })

export default function AuthorProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { data: authors, isPending: authorsLoading } = useAuthors()
  const { data: allPosts, isPending: postsPending } = usePosts(id)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const author = authors?.find((a) => a.id === id)

  const profiles = author?.profiles ?? []

  const bestProfile = useMemo(() => {
    const p = author?.profiles
    if (!p?.length) return null
    return [...p].sort((a, b) => (b.followerCount ?? 0) - (a.followerCount ?? 0))[0]
  }, [author])

  const avatarUrl = bestProfile?.avatarUrl ?? undefined
  const initials = author?.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?"

  const isVerified = profiles.some((p) => p.verified)
  const totalFollowers = profiles.reduce((sum, p) => sum + (p.followerCount ?? 0), 0)

  if (authorsLoading) {
    return (
      <>
        <SiteHeader title="Author" />
        <div className="flex flex-col gap-6 px-4 py-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="pt-8 flex items-center gap-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    )
  }

  if (!author) {
    return (
      <>
        <SiteHeader title="Author not found" />
        <div className="px-4 py-10 text-sm text-muted-foreground">
          Author not found.{" "}
          <Link href="/authors" className="underline underline-offset-2">
            Back to authors
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <SiteHeader title={author.name} />
      <div className="flex flex-1 flex-col gap-6 px-4 py-6">
        {/* Banner with overlapping avatar */}
        <div className="relative h-40 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500">
          <div className="absolute -bottom-10 left-6">
            <Avatar className="size-20 border-4 border-background shadow-md">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Name + meta row */}
        <div className="pt-10 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">{author.name}</h2>
          {isVerified && <Badge variant="secondary">Verified</Badge>}
          {totalFollowers > 0 && (
            <span className="text-sm text-muted-foreground">
              {fmt.format(totalFollowers)} total followers
            </span>
          )}
        </div>

        {/* Platform tabs */}
        {profiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No social profiles synced yet.</p>
        ) : (
          <Tabs defaultValue={profiles[0]?.platform ?? ""}>
            <TabsList>
              {profiles.map((profile) => {
                const meta = PLATFORMS.find((p) => p.key === profile.platform)
                return (
                  <TabsTrigger key={profile.platform} value={profile.platform}>
                    <PlatformIcon platform={profile.platform} className="size-4 mr-1.5" />
                    {meta?.label ?? profile.platform}
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {profiles.map((profile) => {
              const platformPosts = (allPosts ?? []).filter((p) => p.platform === profile.platform)
              return (
                <TabsContent key={profile.platform} value={profile.platform} className="mt-4 flex flex-col gap-6">
                  <ProfileCard profile={profile} />
                  <PostsCards
                    posts={platformPosts}
                    isPending={postsPending}
                    onSelectPost={setSelectedPost}
                  />
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </div>

      <PostDetailSidebar post={selectedPost} onClose={() => setSelectedPost(null)} />
    </>
  )
}

function ProfileCard({ profile }: { profile: AuthorProfile }) {
  const fallback = (profile.displayName ?? profile.handle ?? "?")[0]?.toUpperCase() ?? "?"
  return (
    <Card>
      <CardContent className="flex items-start gap-4 pt-4">
        <Avatar className="size-12 shrink-0">
          <AvatarImage src={profile.avatarUrl ?? undefined} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {profile.displayName && (
              <span className="text-sm font-medium">{profile.displayName}</span>
            )}
            {profile.handle && (
              <span className="text-sm text-muted-foreground">@{profile.handle}</span>
            )}
            {profile.verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
          </div>
          {profile.bio && (
            <p className="text-xs text-muted-foreground line-clamp-2">{profile.bio}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {profile.followerCount != null && (
              <span><strong className="text-foreground">{fmt.format(profile.followerCount)}</strong> followers</span>
            )}
            {profile.followingCount != null && (
              <span><strong className="text-foreground">{fmt.format(profile.followingCount)}</strong> following</span>
            )}
          </div>
          {profile.externalUrl && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
              <a href={profile.externalUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3 mr-1" />
                {profile.externalUrl}
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
