import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { authorsStoreMock } from "@/lib/authors-store"

export const PLATFORMS = [
  { key: "instagram", label: "Instagram",   placeholder: "URL o @usuario" },
  { key: "tiktok",   label: "TikTok",      placeholder: "URL o @usuario" },
  { key: "youtube",  label: "YouTube",      placeholder: "URL o @canal"  },
  { key: "x",        label: "X (Twitter)", placeholder: "URL o @usuario" },
  { key: "facebook", label: "Facebook",    placeholder: "URL o página"   },
] as const

export type PlatformKey = (typeof PLATFORMS)[number]["key"]
export type SocialEntry = { value: string; synchronize: boolean }
export type Author = { id: string; name: string; socials: Partial<Record<PlatformKey, SocialEntry>> }
export type CreateAuthorInput = Omit<Author, "id">

// TODO: replace authors-store mock with apiFetch:
//   list:   () => apiFetch<Author[]>("/authors")
//   create: (input: CreateAuthorInput) => apiFetch<Author>("/authors", { method: "POST", body: JSON.stringify(input) })
const authorsApi = authorsStoreMock

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
