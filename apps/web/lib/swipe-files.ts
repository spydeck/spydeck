import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { swipeFilesStoreMock } from "@/lib/swipe-files-store"

// TODO: swap to apiFetch:
//   listIds: () => apiFetch<string[]>("/swipe-files/ids")
//   list: (authorId?) => apiFetch<Post[]>(`/swipe-files${authorId ? `?authorId=${authorId}` : ""}`)
//   toggle: (id) => apiFetch<void>(`/swipe-files/${id}/toggle`, { method: "POST" })

export function useSwipeFiles(authorId?: string) {
  return useQuery({
    queryKey: ["swipeFiles", authorId ?? "all"],
    queryFn: () => swipeFilesStoreMock.list(authorId),
  })
}

export function useSwipeFileIds() {
  return useQuery({
    queryKey: ["swipeFileIds"],
    queryFn: swipeFilesStoreMock.listIds,
  })
}

export function useToggleSwipeFile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => swipeFilesStoreMock.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swipeFileIds"] })
      queryClient.invalidateQueries({ queryKey: ["swipeFiles"] })
    },
  })
}
