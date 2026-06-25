import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useSettings } from "@/lib/settings"

export interface ScrapeCreatorsCredits {
  remaining: number
}

export interface ApifyUsage {
  used: number
  limit: number
  remaining: number
}

export function useScrapeCreatorsCredits() {
  const { data: settings } = useSettings()
  const enabled = Boolean(settings?.scrapeCreatorsKey)
  return useQuery({
    queryKey: ["credits", "scrapecreators"],
    queryFn: () => apiFetch<ScrapeCreatorsCredits>("/scrapecreators/account/credit-balance"),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useApifyUsage() {
  const { data: settings } = useSettings()
  const enabled = Boolean(settings?.apifyKey)
  return useQuery({
    queryKey: ["credits", "apify"],
    queryFn: () => apiFetch<ApifyUsage>("/apify/usage"),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}
