import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"

export type AdvertiserPlatform = "linkedin" | "meta" | "google" | "tiktok"

export interface AdvertiserChannel {
  id: string
  platform: AdvertiserPlatform
  externalId: string
  name: string
  url: string | null
  logo: string | null
}

export interface ChannelInput {
  platform: AdvertiserPlatform
  externalId: string
  name: string
  url?: string | null
  logo?: string | null
}

export interface Advertiser {
  id: string
  name: string
  logo: string | null
  createdAt: string
  channels: AdvertiserChannel[]
}

export interface CreateAdvertiserInput {
  name: string
  logo?: string | null
  channels?: ChannelInput[]
}

const KEY = ["advertisers"]

export function useAdvertisers() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<Advertiser[]>("/advertisers"),
  })
}

export function useCreateAdvertiser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAdvertiserInput) =>
      apiFetch<Advertiser>("/advertisers", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteAdvertiser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/advertisers/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useAddChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { advertiserId: string; channel: ChannelInput }) =>
      apiFetch(`/advertisers/${vars.advertiserId}/channels`, {
        method: "POST",
        body: JSON.stringify(vars.channel),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useRemoveChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { advertiserId: string; channelId: string }) =>
      apiFetch(`/advertisers/${vars.advertiserId}/channels/${vars.channelId}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
