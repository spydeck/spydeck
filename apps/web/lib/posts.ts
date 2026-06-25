import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { PlatformKey } from "@/lib/authors"

export type { PlatformKey }

export type PostStatus = "draft" | "scheduled" | "published"
export type Post = {
  id: string
  authorId: string
  platform: PlatformKey
  text: string
  mediaUrl?: string
  videoUrl?: string
  postUrl?: string
  status: PostStatus
  date: string // ISO string
  likes: number
  views: number
  shares: number
  comments: number
}

export function usePosts(authorId?: string) {
  return useQuery({
    queryKey: ["posts", authorId ?? "all"],
    queryFn: () =>
      apiFetch<Post[]>(authorId ? `/content?authorId=${authorId}` : "/content"),
  })
}
