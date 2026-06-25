import { useQuery } from "@tanstack/react-query"
import { postsStoreMock } from "@/lib/posts-store"
import type { PlatformKey } from "@/lib/authors"

export type { PlatformKey }

// TODO: replace posts-store mock with apiFetch:
//   list: (authorId?: string) => apiFetch<Post[]>(`/posts${authorId ? `?authorId=${authorId}` : ""}`)
export type PostStatus = "draft" | "scheduled" | "published"
export type PostEngagement = { likes: number; comments: number; views: number; shares: number }
export type Post = {
  id: string
  authorId: string
  platform: PlatformKey
  text: string
  mediaUrl?: string
  status: PostStatus
  date: string // ISO string
  engagement: PostEngagement
}

const postsApi = postsStoreMock

export function usePosts(authorId?: string) {
  return useQuery({
    queryKey: ["posts", authorId ?? "all"],
    queryFn: () => postsApi.list(authorId),
  })
}
