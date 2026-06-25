import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export const PLATFORMS = [
  { key: "instagram", label: "Instagram",   placeholder: "@username" },
  { key: "tiktok",   label: "TikTok",      placeholder: "@username" },
  { key: "youtube",  label: "YouTube",      placeholder: "@channelname" },
  { key: "x",        label: "X (Twitter)", placeholder: "@username" },
  { key: "facebook", label: "Facebook",    placeholder: "username or page name" },
] as const

export type PlatformKey = (typeof PLATFORMS)[number]["key"]
export type SocialEntry = { value: string; synchronize: boolean }

export type AuthorProfile = {
  platform: "instagram" | "tiktok" | "youtube" | "x"
  handle: string | null
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  externalUrl: string | null
  verified: boolean | null
  followerCount: number | null
  followingCount: number | null
  updatedAt: string
}

export type Author = {
  id: string
  name: string
  socials: Partial<Record<PlatformKey, SocialEntry>>
  profiles: AuthorProfile[]
}

export type CreateAuthorInput = Omit<Author, "id" | "profiles">

// ponytail: single constant — change here if queue processing time changes
export const SYNC_REFRESH_DELAY_MS = 5000

/** Platforms that support the extract-profile endpoint. Facebook is excluded. */
const EXTRACTABLE_PLATFORMS = new Set<PlatformKey>(["instagram", "tiktok", "youtube", "x"])

/**
 * Returns the platforms that need extraction based on submitted vs previous socials.
 * Skips platforms that are already synchronized with an identical handle.
 */
export function platformsToSync(
  submitted: Partial<Record<PlatformKey, SocialEntry>>,
  previous: Partial<Record<PlatformKey, SocialEntry>> = {}
): PlatformKey[] {
  return (Object.entries(submitted) as [PlatformKey, SocialEntry][])
    .filter(([platform, entry]) => {
      if (!EXTRACTABLE_PLATFORMS.has(platform)) return false
      if (!entry.synchronize || !entry.value) return false
      const prev = previous[platform]
      // Skip only if already synced with the same handle
      return !(prev?.synchronize && prev.value === entry.value)
    })
    .map(([platform]) => platform)
}

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

export function useExtractProfile() {
  return useMutation({
    mutationFn: ({ id, platform }: { id: string; platform: PlatformKey }) =>
      apiFetch(`/sync/authors/${id}/extract-profile`, {
        method: "POST",
        body: JSON.stringify({ platform }),
      }),
  })
}
