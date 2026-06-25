import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { Post } from "@/lib/posts"

export function useSwipeFiles(authorId?: string) {
  return useQuery({
    queryKey: ["swipeFiles", authorId ?? "all"],
    queryFn: () =>
      apiFetch<Post[]>(authorId ? `/swipe?authorId=${authorId}` : "/swipe"),
  })
}

export function useSwipeFileIds() {
  return useQuery({
    queryKey: ["swipeFileIds"],
    queryFn: async () => {
      const posts = await apiFetch<Post[]>("/swipe")
      return posts.map((p) => p.id)
    },
  })
}

export function useToggleSwipeFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, saved }: { postId: string; saved: boolean }) =>
      saved
        ? apiFetch<void>(`/swipe/${postId}`, { method: "DELETE" })
        : apiFetch<void>("/swipe", { method: "POST", body: JSON.stringify({ postId }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swipeFileIds"] })
      queryClient.invalidateQueries({ queryKey: ["swipeFiles"] })
    },
  })
}
