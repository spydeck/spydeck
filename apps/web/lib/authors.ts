import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export const PLATFORMS = [
  { key: "instagram", label: "Instagram",   placeholder: "URL or @username" },
  { key: "tiktok",   label: "TikTok",      placeholder: "URL or @username" },
  { key: "youtube",  label: "YouTube",      placeholder: "URL or @channel"  },
  { key: "x",        label: "X (Twitter)", placeholder: "URL or @username" },
  { key: "facebook", label: "Facebook",    placeholder: "URL or page"   },
] as const

export type PlatformKey = (typeof PLATFORMS)[number]["key"]
export type SocialEntry = { value: string; synchronize: boolean }
export type Author = { id: string; name: string; socials: Partial<Record<PlatformKey, SocialEntry>> }
export type CreateAuthorInput = Omit<Author, "id">

const authorsApi = {
  list: () => apiFetch<Author[]>("/authors"),
  create: (input: CreateAuthorInput) =>
    apiFetch<Author>("/authors", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: CreateAuthorInput) =>
    apiFetch<Author>(`/authors/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  remove: (id: string) => apiFetch<void>(`/authors/${id}`, { method: "DELETE" }),
}

export function useAuthors() {
  return useQuery({ queryKey: ["authors"], queryFn: authorsApi.list })
}

export function useCreateAuthor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: authorsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["authors"] }),
  })
}

export function useUpdateAuthor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateAuthorInput }) =>
      authorsApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["authors"] }),
  })
}

export function useDeleteAuthor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => authorsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["authors"] }),
  })
}
