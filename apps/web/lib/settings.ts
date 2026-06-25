import { useQuery, useMutation } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export type SettingsMap = Record<string, string>

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<SettingsMap>("/settings"),
  })
}

export function useSaveSettings() {
  return useMutation({
    mutationFn: async (changes: SettingsMap) => {
      await Promise.all(
        Object.entries(changes).map(([key, value]) =>
          apiFetch(`/settings/${key}`, {
            method: "PUT",
            body: JSON.stringify({ value }),
          })
        )
      )
    },
  })
}
